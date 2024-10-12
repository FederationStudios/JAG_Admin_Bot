const { SlashCommandBuilder, CommandInteractionOptionResolver, CommandInteraction, Colors } = require('discord.js');
const Judgment = require('../../DBModels/Judgment.js'); // Adjust path if necessary
const Case = require('../../DBModels/Case.js'); // To validate if case exists
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
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('result_doc_link')
                .setDescription('The Google Docs link of the summary judgment.')
                .setRequired(true)
        ),
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     * @param {CommandInteractionOptionResolver} options
     */
    run: async (interaction, client, options) => {
        const caseId = options.getString('case_id');
        const resultDocLink = options.getString('result_doc_link');

        // Defer reply in case of long operation
        
        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
        return interactionEmbed(3, "[ERR-UPRM]",'', interaction, client, [true, 30]);
        }

        try {
            // Check if the case exists before submitting results
            const existingCase = await Case.findOne({ case_id: caseId });
            if (!existingCase) {
                return interaction.reply({ content: `No case found with ID ${caseId}`, ephemeral: true });
            }

            // Create or update the judgment record
            await Judgment.updateOne(
                { case_id: caseId },
                { case_id: caseId, result_doc_link: resultDocLink, submitted_date: new Date() },
                { upsert: true } // Create the record if it doesn't exist
            );

            // Send success message
            await interaction.reply({ content: `The results for case ID ${caseId} have been successfully submitted.`, ephemeral: true });
        } catch (error) {
            console.error('Error submitting case results:', error);
            await interaction.reply({ content: 'An error occurred while submitting the case results.', ephemeral: true });
        }
    },
};
