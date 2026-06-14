import os
import json
import modal

# 1. Define the Modal Image
image = (
    modal.Image.debian_slim(python_version="3.11")
    .run_commands(
        "apt-get update",
        "apt-get install -y software-properties-common",
    )
    .pip_install(
        "playwright==1.42.0",
        "playwright-stealth",
        "langgraph",
        "langchain-openai",
        "langchain-core",
        "beautifulsoup4",
        "fastapi[standard]"
    )
    .run_commands(
        "playwright install-deps chromium",
        "playwright install chromium",
    )
)

app = modal.App("browser-agent")

# 2. Define the Modal Function
@app.function(image=image, secrets=[modal.Secret.from_name("my-openai-secret", required_keys=["OPENAI_API_KEY"])])
@modal.fastapi_endpoint(method="POST")
async def run_agent(data: dict):
    from langchain_core.tools import tool
    from langchain_openai import ChatOpenAI
    from langgraph.prebuilt import create_react_agent
    from playwright.async_api import async_playwright
    from playwright_stealth import Stealth
    from bs4 import BeautifulSoup
    
    objective = data.get("objective", "Find some jobs")
    print(f"Starting async agent with objective: {objective}")
    
    # Global state for the browser page
    _state = {"page": None}
    
    @tool
    async def navigate(url: str) -> str:
        """Navigate the browser to the specified URL. ALWAYS use this to visit websites."""
        try:
            await _state["page"].goto(url, wait_until="domcontentloaded", timeout=15000)
            title = await _state["page"].title()
            return f"Successfully navigated to {url}. Page title is '{title}'."
        except Exception as e:
            return f"Failed to navigate to {url}: {str(e)}"

    @tool
    async def get_page_content() -> str:
        """Extract the text content of the current page, INCLUDING LINKS, to find information."""
        try:
            html = await _state["page"].content()
            soup = BeautifulSoup(html, "html.parser")
            for script in soup(["script", "style", "noscript"]):
                script.extract()
                
            # Extract base URL
            base_url = await _state["page"].evaluate("window.location.origin")
            
            # Preserve links by formatting them inline
            for a in soup.find_all('a', href=True):
                href = a['href']
                if href.startswith('/'):
                    href = base_url + href
                
                link_text = a.get_text(strip=True)
                if link_text:
                    a.string = f" {link_text} (URL: {href}) "
                    
            text = soup.get_text(separator="\n", strip=True)
            return text[:20000] # Return first 20k chars
        except Exception as e:
            return f"Failed to extract content: {str(e)}"

    @tool
    async def extract_html() -> str:
        """Extract the raw HTML of the current page for detailed parsing if text content is insufficient."""
        try:
            html = await _state["page"].content()
            return html[:10000]
        except Exception as e:
            return f"Failed to extract HTML: {str(e)}"

    tools = [navigate, get_page_content, extract_html]
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    
    system_message = (
        "You are an autonomous web browser agent. "
        "You MUST use your `navigate` tool to visit the requested URLs. "
        "NEVER tell the user to visit a website manually. ALWAYS perform the action yourself. "
        "If a tool fails, report the exact error and try a different approach if possible. "
        "After navigating, use `get_page_content` to read the page. "
        "CRITICAL: When extracting links to jobs or items, ALWAYS format them as proper Markdown links in your final output: [Link Text](https://...). Do NOT just output raw text for the link."
    )
    
    agent_executor = create_react_agent(llm, tools)
    
    async with Stealth().use_async(async_playwright()) as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        # We must use global so the tools can access it
        _state["page"] = await context.new_page()
        
        try:
            result = await agent_executor.ainvoke({
                "messages": [
                    ("system", system_message),
                    ("user", objective)
                ]
            })
            final_response = result["messages"][-1].content
        except Exception as e:
            final_response = f"Agent encountered a fatal error: {str(e)}"
        
        await browser.close()
        
    return {"status": "success", "data": final_response}
