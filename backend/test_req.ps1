$loginBody = @{
    username = "test_agent_12345@gmail.com"
    password = "Password123"
}
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/x-www-form-urlencoded"
$token = $response.access_token
$headers = @{ Authorization = "Bearer $token" }
$projects = Invoke-RestMethod -Uri "http://localhost:8000/api/projects" -Method Get -Headers $headers
$projectId = ($projects | Where-Object { $_.name -match "WS Debug Proj" }).id

try {
    $startBody = @{
        topic = "System Architecture Debate Test"
        participating_roles = @("chief_architect", "security_auditor")
    } | ConvertTo-Json

    $debateRes = Invoke-RestMethod -Uri "http://localhost:8000/api/projects/$projectId/debate" -Method Post -Headers $headers -Body $startBody -ContentType "application/json"
    $debateRes | ConvertTo-Json
} catch {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.ReadToEnd()
}
