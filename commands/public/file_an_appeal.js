const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');

module.exports = {
    name: 'file_an_appeal',
    description: 'File an appeal for different types of appeal courts.',
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
            option.setName('appeal_type')
                .setDescription('Select the type of appeal')
                .setRequired(true)
                .addChoices(
                    { name: 'Summary Appeal Court', value: 'Summary Appeal Court' },
                    { name: 'General Appeal Court', value: 'General Appeal Court' },
                    { name: 'Appeal Tribunal', value: 'Appeal Tribunal' },
                ))
        .addStringOption(option =>
            option.setName('offenses_adjudicated')
                .setDescription('Describe the offenses or reason for appeal')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('google_docs_link')
                .setDescription('Google Docs link (required for Summary Appeal Court only)')
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
            const appealType = interaction.options.getString('appeal_type');
            const offensesAdjudicated = interaction.options.getString('offenses_adjudicated');
            const googleDocsLink = interaction.options.getString('google_docs_link');

            if (appealType === 'Summary Appeal Court' && !googleDocsLink) {
                return await interaction.editReply({ content: "You must provide a Google Docs link when appealing through the Summary Appeal Court.", ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('Appeal Filed')
                .setColor(Colors.Red)
                .addFields(
                    { name: 'Discord Tag', value: interaction.user.tag, inline: true },
                    { name: 'Discord ID', value: interaction.user.id, inline: true },
                    { name: 'Subject', value: subject },
                    { name: 'Prosecuting Authority', value: prosecutingAuthority },
                    { name: 'Appeal Type', value: appealType },
                    { name: 'Offenses/Reason', value: offensesAdjudicated },
                    { name: 'Google Docs Link', value: googleDocsLink ? `[Click Here](${googleDocsLink})` : 'Not provided' }
                )
                .setFooter({ 
                    text: `Filed at ${new Date().toLocaleTimeString()} | MJL Secure Transmission`, 
                    iconURL: client.user.displayAvatarURL() 
                });

            const forwardButton = new ButtonBuilder()
                .setCustomId('forward_to_mjl')
                .setLabel('Forward to MJL Command')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(forwardButton);

            const logChannel = interaction.client.channels.cache.get('1272142489423314964');
            await logChannel.send({ 
                embeds: [embed], 
                components: [row], 
                content: `<@&1275671964324728833> New appeal received. Please review.` 
            });
            await interaction.user.send({ embeds: [embed] });

            await interaction.editReply({ content: 'Your appeal has been filed and sent to the appropriate channels.' });

            const filter = i => i.customId === 'forward_to_mjl' && i.user.id === interaction.user.id;
            const collector = logChannel.createMessageComponentCollector({ filter, time: 7 * 24 * 60 * 60 * 1000 }); // 7 days

            collector.on('collect', async i => {
                const mjlChannel = interaction.client.channels.cache.get('1365895646694871040');
                if (mjlChannel) {
                    await mjlChannel.send({
                        content: `<@&1300664494720028712> New appeal forwarded for review.`,
                        embeds: [embed]
                    });

                    const updatedRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('forward_to_mjl')
                                .setLabel('Forward to MJL Command')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true)
                        );
                    await i.message.edit({ components: [updatedRow] });

                    await i.reply({ content: 'The appeal has been forwarded to the Military Justice League Command.', ephemeral: true });
                } else {
                    await i.reply({ content: 'Error: MJL channel not found.', ephemeral: true });
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
