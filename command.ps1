if (netsh advfirewall firewall show rule name=all | Select-String "8.8.4.4") {
    Write-Output "Status: BLOCKED"
} else {
    Write-Output "Status: ALLOWED"
}
