$data = @{
    username = "admin"
    password = "password"
}
$jsonBody = $data | ConvertTo-Json
$response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/token/" -Method Post -ContentType "application/json" -Body $jsonBody
$tokenData = ConvertFrom-Json $response.Content
$tokenData.access
