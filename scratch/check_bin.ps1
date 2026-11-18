$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    $name = $item.Name
    $path = $item.Path
    if ($name -like "*README*" -or $name -like "*.md" -or $name -like "*.txt") {
        Write-Output "$name | $path"
    }
}
