$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    $origPath = $recycleBin.GetDetailsOf($item, 1)
    if ($origPath -like "*for-perru-lotus-message-photo*") {
        Write-Output "ITEM: $($item.Name)"
        foreach ($verb in $item.Verbs()) {
            Write-Output "  VERB: $($verb.Name)"
        }
    }
}
