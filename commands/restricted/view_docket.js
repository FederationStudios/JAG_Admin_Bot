const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, EmbedBuilder } = require('discord.js');
const case_list = require('../../DBModels/Case.js');
const { interactionEmbed, paginationEmbed } = require('../../functions.js');

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

        const requiredRoles = ['964465282120830986', '1083095989323313242', '1083096092356391043'];
        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));

        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", `You do not have permission to run this command.`, interaction, client, [true, 30]);
        }

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
                    const judgeInfo = caseData.judges_assigned ? `**Judges Username:** ${caseData.judges_username || 'N/A'}` : '';
                    embed.addFields(
                        { name: `Case ID: ${caseData.case_id}`, value: `**Discord Username:** ${caseData.discord_username || 'N/A'}\n**Status:** ${caseData.case_status || 'N/A'}\n**Judges Assigned:** ${caseData.judges_assigned ? 'Yes' : 'No'}\n${judgeInfo}` }
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
