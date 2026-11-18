$shell = New-Object -ComObject Shell.Application
$recycleBin = $shell.Namespace(10)
foreach ($item in $recycleBin.Items()) {
    $name = $item.Name
    $origPath = $recycleBin.GetDetailsOf($item, 1)
    $dateDeleted = $recycleBin.GetDetailsOf($item, 2)
    Write-Output "NAME: $name | ORIG: $origPath | DATE: $dateDeleted | PATH: $($item.Path)"
}
