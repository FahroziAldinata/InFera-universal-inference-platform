
export interface Tensor {
    data: Float32Array | Uint8Array | Int32Array;
    dims: number[];
    type: 'float32' | 'uint8' | 'int32' | 'int64' | 'string';
}

export type ModelFormat = 'onnx' | 'tfjs' | 'tflite' | 'savedmodel';

export type InputType = 'image' | 'video' | 'csv' | 'text' | 'audio';

export interface InferenceResult<TData = unknown> {
    pluginId: string;
    modelId: string;
    executionTimeMs: number;
    data: TData;
    rawOutputShape?: number[];
}

export interface ModelMetadata {
    id: string;
    name: string;
    format: ModelFormat;
    pluginId: string;
    uploadedAt: Date;
    inputShape?: number[];
    labels?: string[];
}

export interface InferencePlugin<TResult = unknown> {
    id: string;
    name: string;
    version: string;
    supportedInputTypes: readonly InputType[];
    supportedModelFormats: readonly ModelFormat[];

    init(): Promise<void>;
    preprocess(input: unknown): Promise<Tensor>;
    postprocess(output: Tensor): Promise<InferenceResult<TResult>>;
    dispose?(): Promise<void>;
}

export interface PluginRegistration {
    plugin: InferencePlugin;
    isEnabled: boolean;
    registeredAt: Date;
}