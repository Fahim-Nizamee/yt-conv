const express = require("express");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const slugify = require("slugify");
const cors = require("cors");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

ffmpeg.setFfmpegPath(ffmpegPath);

app.post("/:videoId", async (req, res) => {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${req.params.videoId}`;

        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).send({ error: "Invalid YouTube Url" });
        }

        const videoInfo = await ytdl.getBasicInfo(videoUrl);
        const fileName = slugify(videoInfo.videoDetails.title, { replacement: " ", locale: "en", remove: /[\/\?<>\\:\*\|"]/g }) || "file";
        const sanitizedFileName = encodeURIComponent(fileName);

        res.set({
            "Content-Disposition": `attachment; filename="${sanitizedFileName}.mp3"`,
            "Access-Control-Expose-Headers": "Content-Disposition",
            "Content-Type": "audio/mpeg",
        });

        const downloadAudio = ytdl(videoUrl, { quality: "highestaudio" });

        downloadAudio.on("error", (err) => {
            console.error('Download audio error:', err);
            res.status(400).send({ error: "Download failed!" });
        });

        const bitrate = req.body.bitrate || 320;

        const convertAudio = new ffmpeg({ source: downloadAudio })
            .withAudioCodec("libmp3lame")
            .toFormat("mp3")
            .audioBitrate(bitrate);

        convertAudio
            .on("end", () => {
                console.log('Conversion finished');
                res.end();
            })
            .on("error", (err) => {
                console.error('Convert audio error:', err);
                convertAudio.kill();
                downloadAudio.destroy();
                res.status(400).send({ error: "Download canceled by the user" });
            })
            .pipe(res, { end: true });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
