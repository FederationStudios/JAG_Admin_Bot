const { SlashCommandBuilder, Client, CommandInteraction } = require('discord.js');
const Case = require('../../DBModels/Case');
const { interactionEmbed } = require("../../functions.js");
const { requiredRoles } = require('../../config.json').discord;

module.exports = {
    name: 'delete_case',
    description: 'Delete a case from the database',
    data: new SlashCommandBuilder()
        .setName('delete_case')
        .setDescription('Deletes a case from the database using the case ID.')
        .addStringOption(option =>
            option.setName('case_id')
                .setDescription('The ID of the case to delete.')
                .setRequired(true)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const hasRole = requiredRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
            return interactionEmbed(3, "[ERR-UPRM]", '', interaction, client, [true, 30]);
        }

        try {
            const caseId = interaction.options.getString('case_id');

            // Find and delete in one step
            const deletedCase = await Case.findOneAndDelete({ case_id: caseId });

            if (!deletedCase) {
                return interaction.editReply({ content: `❌ Case with ID **${caseId}** not found.`, ephemeral: true });
            }

            await interaction.editReply({ content: `✅ Case **${caseId}** has been successfully deleted.`, ephemeral: true });
        } catch (error) {
            console.error('Error deleting case from database:', error);
            return interactionEmbed(3, "[ERR-DEL]", "An error occurred while deleting the case.", interaction, client, [true, 15]);
        }
    }
};
