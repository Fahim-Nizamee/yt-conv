import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [youtubeLink, setYoutubeLink] = useState('');
    const [bitrate, setBitrate] = useState(320); // Default bitrate
    const [error, setError] = useState(null);

    const extractVideoId = (link) => {
        const url = new URL(link);
        return url.searchParams.get('v');
    };

    const handleDownload = async () => {
        try {
            setError(null);

            // Extract video ID from the YouTube link
            const videoId = extractVideoId(youtubeLink);

            if (!videoId) {
                setError('Invalid YouTube link');
                return;
            }

            const response = await axios.post(`http://api.a3styles.com/${videoId}`, { bitrate }, {
                responseType: 'blob',
            });

            const contentDisposition = response.headers['content-disposition'];
            //   console.log('Content-Disposition:', contentDisposition);

            const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
            //   console.log('Filename Match:', filenameMatch);

            const filename = filenameMatch ? decodeURIComponent(filenameMatch[1]) : 'download.mp3';
            //   console.log('Final Filename:', filename);

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
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default App;
