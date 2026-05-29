import { CourtRegions } from '../domain/CourtRegions.js';

export class Exporter {
    static exportImage(canvas, filename = 'heatmap.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    static exportCSV(shots, filename = 'shooting_data.csv') {
        let csv = 'X坐标,Y坐标,投篮结果,时间戳,区域\n';
        
        shots.forEach(shot => {
            const region = CourtRegions.getRegion(shot.x, shot.y);
            const regionName = CourtRegions.getRegionName(region);
            const madeText = shot.made ? '命中' : '未中';
            const date = new Date(shot.timestamp).toLocaleString('zh-CN');
            csv += `${shot.x},${shot.y},${madeText},${date},${regionName}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}