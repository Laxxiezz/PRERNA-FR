Add-Type -AssemblyName System.Drawing

function Crop-Image($srcPath, $dstPath) {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $size = [Math]::Min($src.Width, $src.Height)
    $x = [int](($src.Width - $size) / 2)
    $y = [int](($src.Height - $size) / 2)
    
    $rect = New-Object System.Drawing.Rectangle($x, $y, $size, $size)
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $g.DrawImage($src, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $src.Dispose()
    $bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bmp.Dispose()
}

Crop-Image "$PSScriptRoot\..\public\assets\heart-fill.jpeg" "$PSScriptRoot\..\public\assets\heart-fill-sq.jpeg"
Crop-Image "$PSScriptRoot\..\public\assets\Arri.jpeg" "$PSScriptRoot\..\public\assets\Arri-sq.jpeg"
Write-Host "Success cropping!"
