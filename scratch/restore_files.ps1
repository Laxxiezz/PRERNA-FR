$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    $origPath = $recycleBin.GetDetailsOf($item, 1)
    if ($origPath -like "*for-perru-lotus-message-photo*") {
        $destDir = $origPath
        $destFile = Join-Path $destDir $item.Name
        Write-Output "Restoring: $($item.Name) to $destDir"
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        # Invoke 'undelete' / restore verb
        foreach ($verb in $item.Verbs()) {
            if ($verb.Name -match "restore|undelete|wiederherstellen") {
                $verb.DoIt()
                Write-Output "Successfully invoked restore verb for $($item.Name)"
                break
            }
        }
    }
}
