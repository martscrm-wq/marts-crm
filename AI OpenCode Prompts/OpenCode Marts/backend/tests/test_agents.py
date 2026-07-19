import pytest


@pytest.mark.asyncio
async def test_create_agent(client):
    await client.post("/api/v1/auth/register", json={
        "email": "agent@marts.ai", "password": "password123", "full_name": "Agent Tester",
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "agent@marts.ai", "password": "password123",
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/v1/agents/", json={
        "name": "Test Agent",
        "description": "A test agent",
        "domain": "custom",
        "locale": "en",
    }, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Agent"


@pytest.mark.asyncio
async def test_list_agents(client):
    await client.post("/api/v1/auth/register", json={
        "email": "list@marts.ai", "password": "password123", "full_name": "List Tester",
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "list@marts.ai", "password": "password123",
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/api/v1/agents/", headers=headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_chat_with_agent(client):
    await client.post("/api/v1/auth/register", json={
        "email": "chat@marts.ai", "password": "password123", "full_name": "Chat Tester",
    })
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "chat@marts.ai", "password": "password123",
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = await client.post("/api/v1/agents/", json={
        "name": "Chat Agent",
        "system_prompt": "You are a helpful assistant.",
    }, headers=headers)
    agent_id = create_resp.json()["id"]

    resp = await client.post(f"/api/v1/agents/{agent_id}/chat", json={
        "message": "Hello!",
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    # Without API key, the agent echoes "[AI Disabled - No API Key] Echo: Hello!"
    assert data["reply"] != ""
