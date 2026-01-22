# Port-forward Keycloak first
Start-Job -ScriptBlock {
    kubectl port-forward -n autoally svc/keycloak 8080:8080
}

Start-Sleep -Seconds 5

$KEYCLOAK_URL = "http://localhost:8080"
$REALM = "AutoAlly"

# Get admin token
$tokenBody = @{
    username = "admin"
    password = "admin"
    grant_type = "password"
    client_id = "admin-cli"
}

$tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
$adminToken = $tokenResponse.access_token

Write-Host "Creating 1000 users..." -ForegroundColor Cyan

$headers = @{
    Authorization = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

for ($i = 1; $i -le 1000; $i++) {
    $userBody = @{
        username = "testuser$i"
        enabled = $true
        email = "testuser$i@test.com"
        emailVerified = $true
        credentials = @(@{
            type = "password"
            value = "test123"
            temporary = $false
        })
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$KEYCLOAK_URL/admin/realms/$REALM/users" -Headers $headers -Method Post -Body $userBody
        if ($i % 100 -eq 0) {
            Write-Host "Created $i users" -ForegroundColor Green
        }
    } catch {
        Write-Host "Failed user $i" -ForegroundColor Red
    }
}

Write-Host "Done! Created 1000 users" -ForegroundColor Green

# Stop port-forward
Get-Job | Stop-Job
Get-Job | Remove-Job