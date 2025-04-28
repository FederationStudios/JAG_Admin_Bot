const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case.js');
const { interactionEmbed, paginationEmbed } = require('../../functions.js');
const { decryptData } = require('../../utils/encryptionUtils.js');
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: 'view_docket',
    description: 'View all cases that are currently in progress',
    data: new SlashCommandBuilder()
        .setName('view_docket')
        .setDescription('Fetch and view in-progress case details'),

    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    async run(client, interaction) {
        await interaction.deferReply({ ephemeral: true });

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", '', interaction, client, [true, 30]);
        }

        try {
            const cases = await case_list.find({ case_status: { $in: ['Accepted', 'Awaiting Assignment of Judge', 'Awaiting Approval from JAG Command'] } });
            const pageSize = 5;

            if (!cases || cases.length === 0) {
                return interactionEmbed(3, "No in-progress cases found", "", interaction, client, [true, 15]);
            }

            const embeds = [];
            for (let i = 0; i < cases.length; i += pageSize) {
                const casesPage = cases.slice(i, i + pageSize);

                const embed = new EmbedBuilder()
                    .setTitle('Military Justice League - Docket')
                    .setColor('Green')
                    .setFooter({
                        text: `Page ${Math.floor(i / pageSize) + 1} of ${Math.ceil(cases.length / pageSize)}`,
                        iconURL: interaction.guild.iconURL({ dynamic: true })
                    });

                for (const caseData of casesPage) {
                    const decryptedRobloxUsername = caseData.roblox_username
                        ? decryptData(caseData.roblox_username.encryptedData, caseData.roblox_username.iv)
                        : 'N/A';
                    const decryptedDiscordUsername = caseData.discord_username
                        ? decryptData(caseData.discord_username.encryptedData, caseData.discord_username.iv)
                        : 'N/A';

                    let caseInfo = `**Roblox Username:** ${decryptedRobloxUsername}\n**Discord Username:** ${decryptedDiscordUsername}\n**Status:** ${caseData.case_status || 'N/A'}\n**Judges Assigned:** ${caseData.judges_assigned ? 'Yes' : 'No'}`;

                    if (caseData.judges_assigned && Array.isArray(caseData.judges_username) && caseData.judges_username.length > 0) {
                        caseInfo += `\n**Judges Username(s):** ${caseData.judges_username.join(', ')}`;
                    }

                    embed.addFields({ name: `Case ID: ${caseData.case_id}`, value: caseInfo });
                }

                embeds.push(embed);
            }

            await paginationEmbed(interaction, embeds);
        } catch (error) {
            console.error(error);
            return interactionEmbed(3, "[ERR-ARGS]", "An error occurred while fetching the records.", interaction, client, [true, 15]);
        }
    }
};
