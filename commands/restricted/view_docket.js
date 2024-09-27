const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case.js');
const { interactionEmbed, paginationEmbed } = require('../../functions.js');
const { decryptData } = require('../../utils/encryptionUtils.js');

module.exports = {
    name: 'view_docket',
    description: 'View all cases that are in progress',
    data: new SlashCommandBuilder()
        .setName('view_docket')
        .setDescription('Fetch and view in-progress case details'),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    async run(client, interaction) {
        await interaction.deferReply();

        
        try {
            const cases = await case_list.find({ case_status: { $in: ['Accepted', 'Awaiting Assignment of Judge', 'Awaiting Approval from JAG Command'] } });
            const pageSize = 5;
            
            if (!cases || cases.length === 0) {
                return interactionEmbed(3, "No in-progress cases found", "", interaction, client, [true, 15]);
            }

            let embeds = [];
            for (let i = 0; i < cases.length; i += pageSize) {
                const casesPage = cases.slice(i, i + pageSize);

                const embed = new EmbedBuilder()
                    .setTitle('In-Progress Cases List')
                    .setColor('Green');

                casesPage.forEach(caseData => {
                    const decryptedRobloxUsername = caseData.roblox_username 
                        ? decryptData(caseData.roblox_username.encryptedData, caseData.roblox_username.iv) 
                        : 'N/A';
                    const decryptedDiscordUsername = caseData.discord_username 
                        ? decryptData(caseData.discord_username.encryptedData, caseData.discord_username.iv) 
                        : 'N/A';
                    const judgeInfo = caseData.judges_assigned ? `**Judges Username:** ${caseData.judges_username || 'N/A'}` : '';
                    embed.addFields(
                        { name: `Case ID: ${caseData.case_id}`, value: `**Roblox Username:**: ${decryptedRobloxUsername}\n**Discord Username:** ${decryptedDiscordUsername}\n**Status:** ${caseData.case_status || 'N/A'}\n**Judges Assigned:** ${caseData.judges_assigned ? 'Yes' : 'No'}\n${judgeInfo}` }
                    );
                });

                embeds.push(embed);
            }

            await paginationEmbed(interaction, embeds);
        } catch (error) {
            return interactionEmbed(3, "[ERR-ARGS]", "An error occurred while fetching the records", interaction, client, [true, 15]);
        }
    }
};
