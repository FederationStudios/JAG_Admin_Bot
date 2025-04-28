const { SlashCommandBuilder, CommandInteraction, Client } = require('discord.js');
const Judgment = require('../../DBModels/Judgment.js');
const Case = require('../../DBModels/Case.js');
const { interactionEmbed } = require('../../functions.js');
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: "submit_case_results",
    description: "Submit a case result with a summary judgment link.",
    data: new SlashCommandBuilder()
        .setName('submit_case_results')
        .setDescription('Submit a case result with a summary judgment link.')
        .addStringOption(option =>
            option.setName('case_id')
                .setDescription('The ID of the case to submit results for.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('result_doc_link')
                .setDescription('The Google Docs link of the summary judgment.')
                .setRequired(true)),
    
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", '', interaction, client, [true, 30]);
        }

        const caseId = interaction.options.getString('case_id');
        const resultDocLink = interaction.options.getString('result_doc_link');

        await interaction.deferReply({ ephemeral: true });

        // Validate link format
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(resultDocLink)) {
            return interaction.editReply({ content: "❌ Please provide a valid Google Docs link starting with `http://` or `https://`.", ephemeral: true });
        }

        try {
            const existingCase = await Case.findOne({ case_id: caseId });
            if (!existingCase) {
                return interaction.editReply({ content: `❌ No case found with ID **${caseId}**.`, ephemeral: true });
            }

            await Judgment.updateOne(
                { case_id: caseId },
                { case_id: caseId, result_doc_link: resultDocLink, submitted_date: new Date() },
                { upsert: true }
            );

            await interaction.editReply({ content: `✅ The results for case ID **${caseId}** have been successfully submitted.`, ephemeral: true });
        } catch (error) {
            console.error('Error submitting case results:', error);
            return interaction.editReply({ content: '❌ An error occurred while submitting the case results.', ephemeral: true });
        }
    },
};
