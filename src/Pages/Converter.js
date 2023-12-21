import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
    const [youtubeLink, setYoutubeLink] = useState('');
    const [bitrate, setBitrate] = useState(320); // Default bitrate
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [eventSource, setEventSource] = useState(null);

    const extractVideoId = (link) => {
        const url = new URL(link);
        return url.searchParams.get('v');
    };

    const handleDownload = async () => {
        try {
            setError(null);
            setProgress(0);

            const videoId = extractVideoId(youtubeLink);

            if (!videoId) {
                setError('Invalid YouTube link');
                return;
            }

            const es = new EventSource(`http://localhost:3001/${videoId}`);
            es.onmessage = (event) => {
                const percentage = parseInt(event.data, 10);
                setProgress(percentage);
                console.log(percentage)

                if (percentage === 100) {
                    es.close(); // Close EventSource when progress reaches 100%
                }
            };
            setEventSource(es);

            const response = await axios.post(
                `http://localhost:3001/${videoId}`,
                { bitrate },
                {
                    responseType: 'blob',
                    onDownloadProgress: (progressEvent) => {
                        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentage);
                    },
                }
            );

            const contentDisposition = response.headers['content-disposition'];
            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'download.mp3';

            const blob = new Blob([response.data], { type: 'audio/mpeg' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            setError('Error downloading audio');
            console.error(err);
        }
    };

    useEffect(() => {
        // Clean up the EventSource when the component is unmounted
        return () => {
            if (eventSource) {
                eventSource.close();
                setEventSource(null); // Clear the event source reference
            }
        };
    }, [eventSource]);

    return (
        <div className="App">
            <h1>YouTube Downloader</h1>
            <div>
                <label htmlFor="youtubeLink">YouTube Video Link:</label>
                <input
                    type="text"
                    id="youtubeLink"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="bitrate">Select Bitrate:</label>
                <select id="bitrate" value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
                    <option value={128}>128 kbps</option>
                    <option value={192}>192 kbps</option>
                    <option value={320}>320 kbps</option>
                </select>
            </div>
            <button onClick={handleDownload}>Download Audio</button>
            {progress > 0 && (
                <div>
                    <label>Progress: {progress}%</label>
                    <progress value={progress} max={100} />
                </div>
            )}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default App;
