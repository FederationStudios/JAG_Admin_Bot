const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const nbx = require('noblox.js');
const {interactionEmbed} = require("../../functions.js");
const { mpRoles } = require('../../config.json').discord;

module.exports = {
    name: 'file_a_charges',
    description: 'File charges for a court martial case.',
    data: new SlashCommandBuilder()
        .setName('file_a_charges')
        .setDescription('File charges')
        .addStringOption(option =>
            option.setName('your_username')
        .setDescription('Your roblox Username')
    .setRequired(true))
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('Name of the subject.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('court_martial')
                .setDescription('Court Martial type')
                .setRequired(true)
                .addChoices(
                    { name: 'Summary Court Martial', value: 'Summary Court Martial' },
                    { name: 'General Court Martial', value: 'General Court Martial' },
                    { name: 'Special Court Martial', value: 'Special Court Martial' },
                    { name: 'Appeal against a Summary Court Martial decision', value: 'Appeal against a Summary Court Martial decision' },
                ))
        .addStringOption(option =>
            option.setName('prosecuting_authority')
                .setDescription('Select the prosecuting authority')
                .setRequired(true)
                .addChoices(
                    { name: 'Special Authority', value: 'Special Authority' },
                    { name: 'Commanding Officer', value: 'Commanding Officer' },
                    { name: 'High Command', value: 'High Command' },
                    { name: 'Military Police', value: 'Military Police' },
                    { name: 'Supreme Command', value: 'Supreme Command' },
                ))
        .addStringOption(option =>
            option.setName('google_docs_link')
                .setDescription('Google Docs link related to the case')
                .setRequired(false)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     */            
    run: async(client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const hasRole = mpRoles.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!hasRole) {
        return interactionEmbed(3, "[ERR-UPRM]",'', interaction, client, [true, 30]);
        }

            const username = interaction.options.getString('your_username');
            const subject = interaction.options.getString('subject');
            const courtMartial = interaction.options.getString('court_martial');
            const prosecutingAuthority = interaction.options.getString('prosecuting_authority');
            const googleDocsLink = interaction.options.getString('google_docs_link');



            const embed = new EmbedBuilder()
                .setTitle('Charges Filed')
                .setColor(Colors.Blue)
                .addFields(
                    {name: 'The person submitting the charge', value: username, inline: false},
                    { name: 'Subject', value: subject, inline: false },
                    { name: 'Court Martial', value: courtMartial, inline: false },
                    { name: 'Prosecuting Authority', value: prosecutingAuthority, inline: false }
                )
                .setFooter({ text: `JAG - Secure Transmission | Filed at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`, iconURL: client.user.displayAvatarURL() });

            if (googleDocsLink) {
                embed.addFields({ name: 'Casefile google Docs Link', value: googleDocsLink, inline: false });
            }

            const logChannel = interaction.client.channels.cache.get('1265982268162183178'); // Replace with the correct channel ID
            await logChannel.send({ embeds: [embed], content: `Wakey Wakey noobs new File Appeal charges from MP!` });

            await interaction.editReply({ content: 'The charges have been filed and sent to the appropriate channels.' });

        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'There was an error while processing your request.', ephemeral: true });
            }
        }
    },
};
