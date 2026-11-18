$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    if ($item.Name -eq "README" -and $recycleBin.GetDetailsOf($item, 1) -like "*public\pfp*") {
        foreach ($verb in $item.Verbs()) {
            if ($verb.Name -replace '&','' -match "^Restore$") {
                $verb.DoIt()
                Write-Output "Restored pfp README"
                break
            }
        }
    }
}
