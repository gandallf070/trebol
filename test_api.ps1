$token = & "$PSScriptRoot\test_token.ps1"

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "Token: $token"

# Test GET clients
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/clients/" -Method Get -Headers $headers
$clients = $response.Content
Write-Host "Clients: $clients"

# Test GET categories
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/inventario/categories/" -Method Get -Headers $headers
$categories = $response.Content
Write-Host "Categories: $categories"

# Test POST category
$categoryData = @{
    nombre = "Anillos"
    descripcion = "Categoria de anillos"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/inventario/categories/" -Method Post -Headers $headers -ContentType "application/json" -Body $categoryData
$createdCategory = $response.Content
Write-Host "Created Category: $createdCategory"
