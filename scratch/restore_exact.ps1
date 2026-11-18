$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    $origPath = $recycleBin.GetDetailsOf($item, 1)
    if ($origPath -like "*for-perru-lotus-message-photo*") {
        Write-Output "Restoring: $($item.Name) to $origPath"
        foreach ($verb in $item.Verbs()) {
            if ($verb.Name -replace '&','' -match "^Restore$") {
                $verb.DoIt()
                Write-Output "  -> Invoked Restore for $($item.Name)"
                break
            }
        }
    }
}
