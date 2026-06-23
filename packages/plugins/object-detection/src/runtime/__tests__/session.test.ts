import { describe, it, expect, vi } from 'vitest';
import * as ort from 'onnxruntime-web';
import { loadModel, createSession, disposeSession, getSessionInfo } from '../session';

vi.mock('onnxruntime-web', () => {
    return {
        InferenceSession: {
            create: vi.fn().mockImplementation(async (data: any, options: any) => {
                return {
                    inputNames: ['images'],
                    outputNames: ['output0'],
                    release: vi.fn(),
                };
            }),
        },
    };
});

describe('Session Manager', () => {
    it('should load a file into a Uint8Array', async () => {
        const file = new File([new Uint8Array([1, 2, 3])], 'model.onnx');
        const data = await loadModel(file);
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBe(3);
        expect(data[0]).toBe(1);
    });

    it('should create a session with execution providers', async () => {
        const data = new Uint8Array([1, 2, 3]);
        const session = await createSession(data, ['wasm']);
        
        expect(ort.InferenceSession.create).toHaveBeenCalledWith(data, {
            executionProviders: ['wasm'],
        });
        expect(session.inputNames).toEqual(['images']);
    });

    it('should retrieve session info', async () => {
        const mockSession = {
            inputNames: ['input'],
            outputNames: ['output'],
        } as any;
        const info = getSessionInfo(mockSession);
        expect(info.inputNames).toEqual(['input']);
        expect(info.outputNames).toEqual(['output']);
        expect(info.executionProvider).toBe('wasm');
    });

    it('should release session on dispose', async () => {
        const releaseMock = vi.fn();
        const mockSession = {
            release: releaseMock,
        } as any;
        await disposeSession(mockSession);
        expect(releaseMock).toHaveBeenCalled();
    });
});
