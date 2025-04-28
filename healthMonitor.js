// healthMonitor.js
const { EmbedBuilder, Colors } = require('discord.js');
const mongoose = require('mongoose');

// Configuration
const CHECK_INTERVAL = 10 * 60 * 1000; // Every 10 minutes
const HEALTH_LOG_CHANNEL_ID = '1265982268162183178'; // Replace with your log channel ID

async function startHealthMonitor(client) {
    if (!client || !client.isReady()) {
        console.warn('Client is not ready yet. Health monitor will wait.');
        return;
    }

    console.log('[HEALTH] Starting health monitor...');

    setInterval(async () => {
        try {
            let mongoStatus = '❌ Disconnected';
            if (mongoose.connection.readyState === 1) {
                mongoStatus = '✅ Connected';
            } else if (mongoose.connection.readyState === 2) {
                mongoStatus = '🟡 Connecting';
            }

            const discordStatus = client.ws.status === 0 ? '✅ Connected' : '❌ Not Connected';
            const uptime = formatUptime(client.uptime);

            const embed = new EmbedBuilder()
                .setTitle('Bot Health Check')
                .setColor(mongoStatus.includes('✅') && discordStatus.includes('✅') ? Colors.Green : Colors.Red)
                .addFields(
                    { name: 'MongoDB Status', value: mongoStatus, inline: true },
                    { name: 'Discord Gateway Status', value: discordStatus, inline: true },
                    { name: 'Uptime', value: uptime, inline: false }
                )
                .setTimestamp();

            const logChannel = client.channels.cache.get(HEALTH_LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            } else {
                console.warn('[HEALTH] Health log channel not found.');
            }

            console.log('[HEALTH] Health check completed.');
        } catch (error) {
            console.error('[HEALTH] Error during health check:', error);
        }
    }, CHECK_INTERVAL);
}

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = { startHealthMonitor };
