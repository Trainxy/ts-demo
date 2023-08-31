export interface SrtSegment {
    index: number;
    startTimeMs: number;
    endTimeMs: number;
    content: string;
}

export interface Srt {
    durationMs: number;
    segments: SrtSegment[];
}
