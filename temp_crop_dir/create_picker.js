const fs = require('fs');

async function buildPicker() {
    const coords = JSON.parse(fs.readFileSync('coords.json', 'utf8'));
    const cropX = 427, cropY = 607, cropW = 2986, cropH = 4165;
    
    let itemsHtml = '';
    
    for (const [file, data] of Object.entries(coords)) {
        if (file.includes('People') || file.includes('Gantry') || file.includes('SmartStorage')) continue; 
        
        const newX = data.x - cropX;
        const newY = data.y - cropY;
        if (newX < 0 || newY < 0 || newX + data.w > cropW || newY + data.h > cropH) continue;

        const pctX = ((newX / cropW) * 100).toFixed(4);
        const pctY = ((newY / cropH) * 100).toFixed(4);
        const pctW = ((data.w / cropW) * 100).toFixed(4);
        
        const id = file.replace('.png', '');
        
        itemsHtml += `        <div class="draggable" id="${id}" style="left: ${pctX}%; top: ${pctY}%; width: ${pctW}%;" title="${id}">\n`;
        itemsHtml += `            <img src="images/3layers/04_Assets_Object/${file}" alt="${id}">\n`;
        itemsHtml += `        </div>\n`;
    }
    
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Visual Coordinate Picker</title>
    <style>
        body { background: #1e293b; color: white; font-family: 'Pretendard', sans-serif; text-align: center; margin: 0; padding: 20px; }
        #canvas-container {
            position: relative;
            width: 1000px; /* Fixed display width for tuning */
            margin: 20px auto;
            border: 2px solid #475569;
            box-shadow: 0 0 30px rgba(0,0,0,0.8);
            user-select: none;
            background: #fff;
        }
        #bg-image {
            width: 100%;
            display: block;
            opacity: 0.5; /* Fade background so overlays stand out */
        }
        .draggable {
            position: absolute;
            cursor: grab;
            border: 1px dashed rgba(255,0,0,0.5);
            z-index: 10;
        }
        .draggable:hover {
            border: 2px solid #38bdf8;
            background: rgba(56, 189, 248, 0.2);
            z-index: 20;
        }
        .draggable:active {
            cursor: grabbing;
            z-index: 30;
        }
        .draggable img {
            width: 100%;
            display: block;
            pointer-events: none;
        }
        textarea {
            width: 90%;
            max-width: 1000px;
            height: 200px;
            margin-top: 20px;
            font-family: monospace;
            padding: 15px;
            background: #0f172a;
            color: #38bdf8;
            border: 1px solid #334155;
            border-radius: 8px;
        }
        button { 
            padding: 12px 24px; 
            font-size: 16px; 
            font-weight: bold;
            cursor: pointer; 
            background: #38bdf8;
            color: #0f172a;
            border: none;
            border-radius: 8px;
        }
        button:hover { background: #7dd3fc; }
        .instructions { font-size: 1.1rem; margin-bottom: 20px; color: #cbd5e1; }
    </style>
</head>
<body>
    <h2>🎯 수동 좌표 튜닝 툴 (Visual Coordinate Picker)</h2>
    <p class="instructions">마우스로 빨간 점선 박스 안의 이미지들을 드래그해서 원본 이미지의 정확한 위치에 딱 맞게 겹쳐보세요.<br>배경 이미지는 구분을 위해 살짝 흐리게(반투명하게) 처리해 두었습니다.<br>완료 후 <b>[최종 코드 복사하기]</b> 버튼을 누르시면 됩니다!</p>
    
    <div>
        <button onclick="generateCode()">최종 코드 복사하기</button>
    </div>
    
    <div id="canvas-container">
        <img id="bg-image" src="images/img_3layers_cropped.png" alt="Base">
${itemsHtml}    </div>
    
    <textarea id="output" readonly placeholder="버튼을 누르면 여기에 붙여넣을 코드가 생성됩니다..."></textarea>

    <script>
        const container = document.getElementById('canvas-container');
        let activeEl = null;
        let startX, startY, startLeft, startTop;

        // Add arrow key fine tuning
        window.addEventListener('keydown', e => {
            if (!activeEl) return;
            const step = e.shiftKey ? 0.5 : 0.05; // Shift for faster movement
            let left = parseFloat(activeEl.style.left) || 0;
            let top = parseFloat(activeEl.style.top) || 0;
            
            if (e.key === 'ArrowLeft') left -= step;
            if (e.key === 'ArrowRight') left += step;
            if (e.key === 'ArrowUp') top -= step;
            if (e.key === 'ArrowDown') top += step;
            
            if (e.key.startsWith('Arrow')) {
                e.preventDefault();
                activeEl.style.left = left.toFixed(4) + '%';
                activeEl.style.top = top.toFixed(4) + '%';
            }
        });

        document.querySelectorAll('.draggable').forEach(el => {
            el.addEventListener('mousedown', e => {
                // remove highlight from all
                document.querySelectorAll('.draggable').forEach(d => d.style.border = '1px dashed rgba(255,0,0,0.5)');
                // highlight active
                el.style.border = '2px solid #facc15'; // yellow border when selected
                
                activeEl = el;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseFloat(el.style.left) || 0;
                startTop = parseFloat(el.style.top) || 0;
            });
        });

        window.addEventListener('mousemove', e => {
            if (!activeEl || e.buttons !== 1) return; // Only if mouse is down
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            const containerRect = container.getBoundingClientRect();
            
            const dxPct = (dx / containerRect.width) * 100;
            const dyPct = (dy / containerRect.height) * 100;
            
            activeEl.style.left = (startLeft + dxPct).toFixed(4) + '%';
            activeEl.style.top = (startTop + dyPct).toFixed(4) + '%';
        });

        window.addEventListener('mouseup', () => {
            // Keep activeEl selected for arrow key tuning
        });
        
        // Deselect if clicked outside
        document.addEventListener('mousedown', e => {
            if (!e.target.closest('.draggable') && e.target.id !== 'bg-image') {
                document.querySelectorAll('.draggable').forEach(d => d.style.border = '1px dashed rgba(255,0,0,0.5)');
                activeEl = null;
            }
        });

        function generateCode() {
            let html = '                <!-- 복사해서 교체할 영역 시작 -->\\n';
            html += '                <div class="interactive-architecture" style="position: relative; width: 100%; max-width: 1000px; margin: 0 auto;">\\n';
            html += '                    <img src="images/img_3layers_cropped.png" alt="MOBYUS 3-Layer Architecture Base" style="width: 100%; display: block;">\\n';
            
            document.querySelectorAll('.draggable').forEach(el => {
                const id = el.id;
                const left = el.style.left;
                const top = el.style.top;
                const width = el.style.width;
                html += '                    <a href="#" class="arch-layer-item" style="position: absolute; left: ' + left + '; top: ' + top + '; width: ' + width + '; display: block;">\\n';
                html += '                        <img src="images/3layers/04_Assets_Object/' + id + '.png" alt="' + id + '" style="width: 100%; display: block;">\\n';
                html += '                    </a>\\n';
            });
            
            html += '                </div>\\n';
            html += '                <!-- 복사해서 교체할 영역 끝 -->';
            
            const out = document.getElementById('output');
            out.value = html;
            out.select();
            document.execCommand('copy');
            alert('코드가 클립보드에 복사되었습니다!\\n이 코드를 저(Antigravity)에게 그대로 붙여넣어 주시거나 index_test.html에 직접 붙여넣으시면 됩니다!');
        }
    </script>
</body>
</html>`;

    fs.writeFileSync('../coord_picker.html', html);
    console.log('Picker created!');
}

buildPicker().catch(console.error);
