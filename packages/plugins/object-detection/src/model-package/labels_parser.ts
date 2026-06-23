/**
 * Parses labels.txt containing one label name per line.
 */
export function parseLabelsText(txtBytes: Uint8Array): string[] {
    const txt = new TextDecoder('utf-8').decode(txtBytes);
    return txt
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
}

/**
 * Parses labels.json supporting both array and string key map structures.
 * - Array: ["person", "car"]
 * - Map: {"0": "person", "1": "car"}
 */
export function parseLabelsJson(jsonBytes: Uint8Array): string[] {
    let jsonStr: string;
    try {
        jsonStr = new TextDecoder('utf-8', { fatal: true }).decode(jsonBytes);
    } catch (err) {
        throw new Error('Format file labels.json bukan UTF-8 yang valid.');
    }

    let parsed: any;
    try {
        parsed = JSON.parse(jsonStr);
    } catch (err: any) {
        throw new Error(`labels.json bukan JSON yang valid: ${err.message}`);
    }

    if (Array.isArray(parsed)) {
        return parsed.map((item: any) => String(item).trim()).filter(Boolean);
    }

    if (parsed && typeof parsed === 'object') {
        const keys = Object.keys(parsed);
        const isNumeric = keys.every(k => !isNaN(Number(k)));
        
        if (isNumeric) {
            keys.sort((a, b) => Number(a) - Number(b));
        }

        return keys.map(k => String(parsed[k]).trim()).filter(Boolean);
    }

    throw new Error('Format labels.json tidak valid. Harus berupa array atau key-value map.');
}
