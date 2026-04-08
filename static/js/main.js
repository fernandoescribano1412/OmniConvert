const workarea = document.getElementById('workarea');
const workareaTitle = document.getElementById('workarea-title');
const workareaContent = document.getElementById('workarea-content');

const toolsContent = {
    'nef': {
        title: 'NEF a JPG Converter',
        html: `
            <div class="dropzone" id="dropzone" onclick="document.getElementById('fileInput').click()">
                <i class="ph ph-upload-simple dropzone-icon"></i>
                <p>Arrastra tu archivo .nef o .zip aquí, o haz clic para seleccionar</p>
                <input type="file" id="fileInput" hidden accept=".nef,.zip">
            </div>
            <div id="file-info" style="margin-top: 15px; color: var(--accent-blue); text-align: center;"></div>
            <button class="btn-primary" style="margin-top: 20px;" onclick="uploadFile()">
                <i class="ph ph-magic-wand"></i> Convertir a JPG
            </button>
        `
    },
    'yt': {
        title: 'YouTube Downloader',
        html: `
            <div class="form-group">
                <label>Enlace del Video de YouTube</label>
                <input type="url" id="yt-url" class="cool-input" placeholder="https://youtube.com/watch?v=...">
            </div>
            <div class="form-group" style="display: flex; gap: 15px;">
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" name="format" value="mp4" checked> MP4 (Video)
                </label>
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" name="format" value="mp3"> MP3 (Audio)
                </label>
            </div>
            <div class="form-group" style="display: flex; gap: 15px;">
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" name="quality" value="high" checked> Alta Calidad (Max)
                </label>
                <label style="display: flex; align-items: center; gap: 5px;">
                    <input type="radio" name="quality" value="low"> Calidad Ligera (720p/128kbps)
                </label>
            </div>
            <button class="btn-primary" onclick="downloadYoutube()">
                <i class="ph ph-download-simple"></i> Procesar Descarga
            </button>
        `
    },
    'apk': {
        title: 'URL to APK Builder',
        html: `
            <div class="form-group">
                <label>URL de la Aplicación Web</label>
                <input type="url" id="apk-url" class="cool-input" placeholder="https://mi-agencia.com">
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 20px;">
                El servidor compilará un Webview nativo utilizando Gradle. Esto puede tardar varios minutos la primera vez.
            </p>
            <button class="btn-primary" onclick="buildApk()">
                <i class="ph ph-hammer"></i> Construir APK
            </button>
        `
    },
    'pdf': {
        title: 'PDF a Word Converter',
        html: `
            <div class="dropzone" id="dropzonePdf" onclick="document.getElementById('pdfInput').click()">
                <i class="ph ph-file-pdf dropzone-icon" style="color: var(--accent-purple);"></i>
                <p>Arrastra tu archivo .pdf aquí, o haz clic para seleccionar</p>
                <input type="file" id="pdfInput" hidden accept=".pdf">
            </div>
            <div id="pdf-file-info" style="margin-top: 15px; color: var(--accent-purple); text-align: center;"></div>
            <button class="btn-primary" style="margin-top: 20px; background: var(--accent-purple); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);" onclick="uploadPdf()">
                <i class="ph ph-swap"></i> Convertir a Word (DOCX)
            </button>
        `
    },
    'exe': {
        title: 'URL a EXE Converter',
        html: `
            <div class="form-group">
                <label>URL de la aplicación web</label>
                <input type="url" id="exe-url" class="cool-input" placeholder="https://mi-aplicacion.com">
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9em; margin-bottom: 20px;">
                El servidor encapsulará tu web en una aplicación nativa de Windows (Electron/Nativefier). Este proceso puede tardar un poco.
            </p>
            <button class="btn-primary" style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);" onclick="buildExe()">
                <i class="ph ph-terminal-window"></i> Construir EXE
            </button>
        `
    }
};

function openTool(toolId) {
    const tool = toolsContent[toolId];
    if (tool) {
        workareaTitle.innerText = tool.title;
        workareaContent.innerHTML = tool.html;
        
        workarea.classList.remove('hidden');
        
        // Scroll smoothly to workarea
        setTimeout(() => {
            workarea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setupDropzone();
        }, 100);
    }
}

function closeTool() {
    workarea.classList.add('hidden');
}

function setupDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    if (!dropzone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileInfo();
    });

    fileInput.addEventListener('change', updateFileInfo);

    function updateFileInfo() {
        if (fileInput.files.length > 0) {
            document.getElementById('file-info').innerText = 'Archivo cargado: ' + fileInput.files[0].name;
        }
    }
}

function showLoader(text = 'Procesando mágico...') {
    workareaContent.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p>${text}</p>
        </div>
    `;
}

// Function stubs for connecting to Flask endpoints.
function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert("Por favor selecciona un archivo.");
        return;
    }
    showLoader('Procesando archivo NEF... (Esto puede tardar un poco)');
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/api/convert/nef', {
        method: 'POST',
        body: formData
    }).then(res => {
        if (!res.ok) throw new Error('Error al procesar');
        return res.blob();
    }).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileInput.files[0].name.replace('.nef', '.jpg').replace('.NEF', '.jpg');
        if(fileInput.files[0].name.endsWith('.zip')) {
            a.download = 'converted_jpgs.zip';
        }
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        openTool('nef'); // Reset view
    }).catch(err => {
        alert("Ocurrió un error en la conversión.");
        openTool('nef');
    });
}

function downloadYoutube() {
    const url = document.getElementById('yt-url').value;
    const format = document.querySelector('input[name="format"]:checked').value;
    const quality = document.querySelector('input[name="quality"]:checked').value;

    if(!url) {
        alert("Introduce una URL válida.");
        return;
    }
    showLoader('Descargando y convirtiendo... (Depende de tu conexión)');
    
    fetch('/api/convert/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format, quality })
    }).then(res => {
        if (!res.ok) throw new Error('Error de servidor');
        const disposition = res.headers.get('Content-Disposition');
        let filename = 'download';
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) { 
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        return res.blob().then(blob => ({ blob, filename }));
    }).then(({blob, filename}) => {
        const aUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = aUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(aUrl);
        openTool('yt'); // Reset view
    }).catch(err => {
        alert("No se pudo procesar el enlace. Puede que requiera ffmpeg en tu sistema.");
        openTool('yt');
    });
}

function buildApk() {
    const url = document.getElementById('apk-url').value;
    if(!url) {
        alert("Introduce la URL web para encapsular.");
        return;
    }
    showLoader('Androides trabajando (Construyendo APK)...');
    
    fetch('/api/convert/apk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    }).then(res => res.json()).then(data => {
        if(data.error) throw new Error(data.error);
        
        workareaContent.innerHTML = `
            <div style="text-align: center;">
                <i class="ph-fill ph-check-circle" style="font-size: 48px; color: var(--accent-green); margin-bottom: 20px;"></i>
                <h3>¡Petición de Compilación Recibida!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${data.message}</p>
                <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; font-family: monospace; color: var(--accent-blue);">
                    <i class="ph-fill ph-terminal"></i> buildozer android debug empezará en breve...
                </div>
                <button class="btn-primary" onclick="openTool('apk')">Volver</button>
            </div>
        `;
    }).catch(err => {
        alert("Error de conexión con el constructor de APK.");
        openTool('apk');
    });
}

function buildExe() {
    const url = document.getElementById('exe-url').value;
    if(!url) {
        alert("Introduce la URL web para encapsular.");
        return;
    }
    showLoader('Empaquetando en ejecutable de Windows (.exe)...');
    
    fetch('/api/convert/exe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    }).then(res => res.json()).then(data => {
        if(data.error) throw new Error(data.error);
        
        workareaContent.innerHTML = `
            <div style="text-align: center;">
                <i class="ph-fill ph-check-circle" style="font-size: 48px; color: var(--accent-green); margin-bottom: 20px;"></i>
                <h3>¡Petición de Compilación Windows Recibida!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${data.message}</p>
                <div class="form-group" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; font-family: monospace; color: #f59e0b;">
                    <i class="ph-fill ph-terminal"></i> npm nativefier empezará en breve en el servidor...
                </div>
                <button class="btn-primary" onclick="openTool('exe')" style="background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">Volver</button>
            </div>
        `;
    }).catch(err => {
        alert("Error de conexión con el constructor de EXE.");
        openTool('exe');
    });
}

function uploadPdf() {
    const fileInput = document.getElementById('pdfInput');
    if (!fileInput || fileInput.files.length === 0) {
        alert("Por favor selecciona un archivo PDF.");
        return;
    }
    showLoader('Reconstruyendo documento PDF a Word...');
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/api/convert/pdf', {
        method: 'POST',
        body: formData
    }).then(res => {
        if (!res.ok) throw new Error('Error al procesar PDF');
        return res.blob();
    }).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileInput.files[0].name.replace('.pdf', '.docx').replace('.PDF', '.docx');
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        openTool('pdf'); // Reset view
    }).catch(err => {
        alert("Ocurrió un error en la conversión de PDF.");
        openTool('pdf');
    });
}

// Add PDF event listener to setupDropzone
document.addEventListener('change', function(e) {
    if(e.target && e.target.id == 'pdfInput') {
        if(e.target.files.length > 0) {
            document.getElementById('pdf-file-info').innerText = 'Documento: ' + e.target.files[0].name;
        }
    }
});
