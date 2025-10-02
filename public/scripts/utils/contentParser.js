// contentParser.js
export function parseMarkdown(text) {
    // Escapa HTML primero
    let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Código `code`
    safeText = safeText.replace(/`([^`]+)`/g, '<span class="code-block">$1</span>');
    // Negrita **bold** o __bold__
    safeText = safeText.replace(/(\*\*|__)(.*?)\1/g, '<b>$2</b>');
    // Cursiva *italic* o _italic_
    safeText = safeText.replace(/(\*|_)(.*?)\1/g, '<i>$2</i>');
    return safeText;
}

export function parseMedia(text) {
    // Si la URL es una imagen...
    if (text.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        return `<img src="${text}" style="max-width: 100%; height: auto; border-radius: 5px;">`;
    }
    // Si la URL es de YouTube...
    if (text.includes('youtube.com/watch?v=')) {
        const videoId = text.match(/v=([^&]+)/i);
        if (videoId && videoId[1]) {
            return `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId[1]}" frameborder="0" allowfullscreen></iframe>`;
        }
    }
    
    // Si no es un medio, aplica markdown
    return parseMarkdown(text); 
}