const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');

module.exports = {
    name: 'file_an_appeal',
    description: 'File an appeal for different court martial cases.',
    data: new SlashCommandBuilder()
        .setName('file_an_appeal')
        .setDescription('File an appeal')
        .addStringOption(option =>
            option.setName('subject')
                .setDescription('Your Roblox username.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('prosecuting_authority')
                .setDescription('Select the prosecuting authority')
                .setRequired(true)
                .addChoices(
                    { name: '3rd Guards Tanks', value: '3rd Guards Tanks' },
                    { name: '98th Airborne Division', value: '98th Airborne Division' },
                    { name: '1st Shock Infantry', value: '1st Shock Infantry' },
                    { name: 'Foreign Operations Department', value: 'Foreign Operations Department' },
                    { name: 'Imperial Special Operations Command', value: 'Imperial Special Operations Command' },
                    { name: 'Imperial Guard', value: 'Imperial Guard' },
                    { name: 'Military Police', value: 'Military Police' },
                    { name: 'Military Training Academy', value: 'Military Training Academy' },
                    { name: 'Quartermaster', value: 'Quartermaster' },
                    { name: 'Administrative & Community Services', value: 'Administrative & Community Services' },
                ))
        .addStringOption(option =>
            option.setName('court_martial_type')
                .setDescription('Select the court martial type')
                .setRequired(true)
                .addChoices(
                    { name: 'Summary Court Martial', value: 'Summary Court Martial' },
                    { name: 'General Court Martial', value: 'General Court Martial' },
                    { name: 'Special Court Martial', value: 'Special Court Martial' },
                    { name: 'Appeal against a Summary Court Martial decision', value: 'Appeal against a Summary Court Martial decision' },
                ))
        .addStringOption(option =>
            option.setName('offenses_adjudicated')
                .setDescription('Description of the offenses adjudicated')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('google_docs_link')
                .setDescription('Attach the link file')
                .setRequired(false)),
    /**
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {CommandInteractionOptionResolver} options
     */            
    run: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.channel.id !== "1272170550730690592") {
                return await interaction.editReply({ content: "This command can only be used in <#1272170550730690592>", ephemeral: true });
            }

            const subject = interaction.options.getString('subject');
            const prosecutingAuthority = interaction.options.getString('prosecuting_authority');
            const courtMartialType = interaction.options.getString('court_martial_type');
            const offensesAdjudicated = interaction.options.getString('offenses_adjudicated');
            const linkAttachment = interaction.options.getString('google_docs_link') || 'No link provided';

            const embed = new EmbedBuilder()
                .setTitle('Appeal Filed')
                .setColor(Colors.Red)
                .addFields(
                    { name: 'Discord Tag', value: interaction.user.tag },
                    { name: 'Discord ID', value: interaction.user.id },
                    { name: 'Subject', value: subject, inline: false },
                    { name: 'Prosecuting Authority', value: prosecutingAuthority, inline: false },
                    { name: 'Court Martial Type', value: courtMartialType, inline: false },
                    { name: 'Offenses Adjudicated', value: offensesAdjudicated, inline: false },
                    { name: 'Google Link', value: `[Click Here](${linkAttachment})`, inline: false }
                )
                .setFooter({ text: `JAG - Secure Transmission | Filed at ${new Date().toLocaleTimeString()} ${new Date().toString().match(/GMT([+-]\d{2})(\d{2})/)[0]}`, iconURL: client.user.displayAvatarURL() });

            const forwardButton = new ButtonBuilder()
                .setCustomId('forward_to_mp')
                .setLabel('Forward to MP')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(forwardButton);

            const logChannel = interaction.client.channels.cache.get('1272800122601865256'); // Replace with the correct channel ID
            await logChannel.send({ embeds: [embed], components: [row], content: `hi my dear noobs plz approve this <@&1275671964324728833>` });
            await interaction.user.send({ embeds: [embed] });

            await interaction.editReply({ content: 'Your appeal has been filed and sent to the appropriate channels.' });

            // Button interaction handler
            const filter = i => i.customId === 'forward_to_mp' && i.user.id === interaction.user.id;
            const collector = logChannel.createMessageComponentCollector({ filter, time: 7 * 24 * 60 * 60 * 1000 }); // 7 days for collector
            collector.on('collect', async i => {
                const mpChannel = interaction.client.channels.cache.get('685141430691561473'); // Replace with the MP channel ID
            
                if (mpChannel) {
                    await mpChannel.send({
                        content: `Hi, my dear noobs new case incoming get ready oorah!!!!! evaluate and then file charges <@&1139641077796716614> <@&898181248751640676>`,
                        embeds: [embed]
                    });

                    // Update the original message to make the button invisible
                    const updatedRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('forward_to_mp')
                                .setLabel('Forward to MP')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        );
                    await i.message.edit({ components: [updatedRow] });

                    await i.reply({ content: 'The appeal has been forwarded to the Military Police server.', ephemeral: true });
                } else {
                    await i.reply({ content: 'Error: MP channel not found.', ephemeral: true });
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    logChannel.send({ content: 'The forward button was not used.' });
                }
            });

        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: 'There was an error while processing your request.', ephemeral: true });
            }
        }
    },
};
