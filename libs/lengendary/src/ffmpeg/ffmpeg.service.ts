import { Injectable } from '@nestjs/common';
import { execSync, spawnSync, execFileSync } from 'child_process';

@Injectable()
export class FfmpegService {
    getVideoPixelFormat(videoPath: string) {
        const result = execSync(
            `ffprobe -loglevel error -show_entries stream=pix_fmt -of csv=p=0 ${videoPath}`,
        ).toString();
        return result;
    }

    getVideoInfo(videoPath: string) {
        const result = execSync(
            `ffprobe -v quiet -print_format json -show_format -show_streams ${videoPath}`,
        ).toString();
        return JSON.parse(result);
    }

    splitVideo(
        videoPath: string,
        outputPath: string,
        startTime: number,
        durationMs: number,
    ) {
        const startTimeParams = startTime > 0 ? `-ss ${startTime / 1000}` : '';
        const otherParams =
            startTime > 0
                ? `-avoid_negative_ts make_zero -map '0:0' '-c:0' copy -map '0:1' '-c:1' copy -map_metadata 0 -movflags '+faststart' -default_mode infer_no_subs -ignore_unknown -f mp4 -y`
                : `-map '0:0' '-c:0' copy -map '0:1' '-c:1' copy -map_metadata 0 -movflags '+faststart' -default_mode infer_no_subs -ignore_unknown -f mp4 -y`;

        const cmd = `ffmpeg -hide_banner -loglevel quiet ${startTimeParams} -i ${videoPath} -t ${
            durationMs / 1000
        } ${otherParams} ${outputPath}`;

        const result = execSync(cmd).toString();
        return result;
    }

    flipVideo(videoPath: string, outputPath: string) {
        const result = execSync(
            `ffmpeg -i ${videoPath} -vf hflip ${outputPath}`,
        ).toString();
        return result;
    }

    formatVideo(
        videoPath: string,
        outputPath: string,
        resolution: {
            width: number;
            height: number;
        },
        format = '720p',
    ) {
        let videoMode = 'horizontal';
        const videoCrf = 30;
        const scaleTo = {
            w: 720,
            h: 1280,
        };
        let scaleStr = scaleTo.w + ':' + scaleTo.h;
        const { width, height } = resolution;
        if (width / height < 0.8) {
            videoMode = 'vertical';
            scaleStr = '-1:' + scaleTo.h;
        }
        if (width / height < 0.5) {
            videoMode = 'vertical';
            scaleStr = scaleTo.w + ':-1';
        }

        /**
        let cmd: string;
        if (videoMode === 'vertical') {
            cmd = `ffmpeg -i ${videoPath}  -preset superfast \
                    -filter_complex "[0:v]boxblur=40,scale=${scaleTo.w}x${scaleTo.h},setsar=1[bg];[0:v]scale=${scaleStr},crop=${scaleTo.w}:${scaleTo.h}[fg];[bg][fg]overlay=y=(H-h)/2" \
                    -r 30000/1001 -video_track_timescale 30k \
                    -c:a copy -an \
                    -vcodec libx264 -crf ${videoCrf} -y ${outputPath}`;
        } else {
            cmd = `ffmpeg -i ${videoPath}  -preset superfast \
                    -filter_complex "[0:v]boxblur=40,scale=${scaleTo.w}x${scaleTo.h},setsar=1[bg];[0:v]scale=${scaleStr}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=y=(H-h)/2" \
                    -r 30000/1001 -video_track_timescale 30k \
                    -c:a copy -an \
                    -vcodec libx264 -crf ${videoCrf} -y ${outputPath}`;
        } */
        let args = [];
        if (videoMode === 'vertical') {
            args = [
                '-i',
                videoPath,
                '-preset',
                'superfast',
                '-filter_complex',
                `"[0:v]boxblur=40,scale=${scaleTo.w}x${scaleTo.h},setsar=1[bg];[0:v]scale=${scaleStr},crop=${scaleTo.w}:${scaleTo.h}[fg];[bg][fg]overlay=y=(H-h)/2"`,
                '-r',
                '30000/1001',
                '-video_track_timescale',
                '30k',
                '-c:a',
                'copy',
                '-an',
                '-vcodec',
                'libx264',
                '-crf',
                videoCrf,
                '-y',
                outputPath,
            ];
        } else {
            args = [
                '-i',
                videoPath,
                '-preset',
                'superfast',
                '-filter_complex',
                `"[0:v]boxblur=40,scale=${scaleTo.w}x${scaleTo.h},setsar=1[bg];[0:v]scale=${scaleStr}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=y=(H-h)/2"`,
                '-r',
                '30000/1001',
                '-video_track_timescale',
                '30k',
                '-c:a',
                'copy',
                '-an',
                '-vcodec',
                'libx264',
                '-crf',
                videoCrf,
                '-y',
                outputPath,
            ];
        }

        // const result = execSync(cmd).toString();
        const result = execFileSync('ffmpeg', args, { shell: true }).toString();
        return result;
    }
}
