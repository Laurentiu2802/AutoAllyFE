# Configuration
$KEYCLOAK_URL = "http://localhost:8080"
$REALM = "AutoAlly"
$ADMIN_USER = "admin"
$ADMIN_PASSWORD = "admin"

function Get-FreshToken {
    $tokenBody = @{
        username = $ADMIN_USER
        password = $ADMIN_PASSWORD
        grant_type = "password"
        client_id = "admin-cli"
    }
    $tokenResponse = Invoke-RestMethod -Uri "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    return $tokenResponse.access_token
}

Write-Host "Getting admin token..." -ForegroundColor Cyan
$adminToken = Get-FreshToken
Write-Host "Admin token obtained" -ForegroundColor Green

$rolesUrl = "$KEYCLOAK_URL/admin/realms/$REALM/roles"
$headers = @{
    Authorization = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

$roles = Invoke-RestMethod -Uri $rolesUrl -Headers $headers -Method Get
$carEnthusiastRole = $roles | Where-Object { $_.name -eq "CAR_ENTHUSIAST" }
Write-Host "CAR_ENTHUSIAST role ID: $($carEnthusiastRole.id)" -ForegroundColor Cyan

$firstNames = @("James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen")
$lastNames = @("Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin")

Write-Host "`nCreating 1000 test users..." -ForegroundColor Cyan

$usersUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users"
$successCount = 0
$failCount = 0

for ($i = 1; $i -le 1000; $i++) {
    # Refresh token every 100 users
    if ($i % 100 -eq 0) {
        $adminToken = Get-FreshToken
        $headers["Authorization"] = "Bearer $adminToken"
        Write-Host "Token refreshed at user $i" -ForegroundColor Yellow
    }
    
    $username = "testuser$i"
    
    # Check if user exists
    try {
        $checkUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users?username=$username&exact=true"
        $existing = Invoke-RestMethod -Uri $checkUrl -Headers $headers -Method Get
        if ($existing.Count -gt 0) {
            $successCount++
            continue
        }
    } catch {}
    
    $firstName = $firstNames[(Get-Random -Minimum 0 -Maximum $firstNames.Length)]
    $lastName = $lastNames[(Get-Random -Minimum 0 -Maximum $lastNames.Length)]
    $email = "testuser$i@autoally.test"
    
    $credential = @{
        type = "password"
        value = "test123"
        temporary = $false
    }
    
    $userObj = @{
        username = $username
        firstName = $firstName
        lastName = $lastName
        email = $email
        emailVerified = $true
        enabled = $true
        credentials = @($credential)
    }
    
    $userBody = $userObj | ConvertTo-Json -Depth 5
    
    try {
        $createResponse = Invoke-WebRequest -Uri $usersUrl -Headers $headers -Method Post -Body $userBody -ErrorAction Stop
        $userLocation = $createResponse.Headers.Location
        $userId = $userLocation -replace '.*/users/', ''
        
        $roleObj = @{
            id = $carEnthusiastRole.id
            name = $carEnthusiastRole.name
        }
        
        $roleAssignUrl = "$KEYCLOAK_URL/admin/realms/$REALM/users/$userId/role-mappings/realm"
        $roleJson = ConvertTo-Json -InputObject @($roleObj) -Depth 5
        Invoke-RestMethod -Uri $roleAssignUrl -Headers $headers -Method Post -Body $roleJson -ContentType "application/json" | Out-Null
        
        $successCount++
        
        if ($i % 50 -eq 0) {
            Write-Host "Created $i users..." -ForegroundColor Green
        }
    }
    catch {
        $failCount++
        Write-Host "Failed to create $username : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "User creation complete!" -ForegroundColor Green
Write-Host "Successfully created: $successCount users" -ForegroundColor Green
Write-Host "Failed: $failCount users" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan