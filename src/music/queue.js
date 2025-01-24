const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Посмотреть очередь песен'),

  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guild.id);
    const voiceChannel = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    // Check if the bot is already in another voice channel
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `${interaction.user}, я уже проигрываю песню в другом голосовом канале, присоединяйся к нам! <#${botVoiceChannel.id}>`,
        ephemeral: true
      });
    }
    
    if (!voiceChannel) {
      return interaction.reply({ content: `${interaction.user}, Сначала вы должены присоединиться к голосовому каналу!`, ephemeral: true });
    }

    if (!queue) {
      return interaction.reply({ content: 'Очередь пуста.', ephemeral: true });
    }

    const songsPerPage = 20;
    const totalPages = Math.ceil(queue.songs.length / songsPerPage);
    let page = 0;

    const generateEmbed = (page) => {
      const start = page * songsPerPage;
      const end = start + songsPerPage;

      const embed = new EmbedBuilder()
        .setTitle('🎶 Очередь песен')
        .setDescription(queue.songs.slice(start, end).map((song, id) => `**${start + id + 1}.** [${song.name}](${song.url})`).join('\n'))
        .setFooter({ text: `Страница ${page + 1} из ${totalPages}` })
        .setColor(embedcolor);

      return embed;
    };

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prev_page')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next_page')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === totalPages - 1)
      );

    const message = await interaction.reply({ embeds: [generateEmbed(page)], components: [row], fetchReply: true });

    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (btnInteraction) => {
      if (btnInteraction.customId === 'prev_page' && page > 0) {
        page--;
      } else if (btnInteraction.customId === 'next_page' && page < totalPages - 1) {
        page++;
      }

      await btnInteraction.update({
        embeds: [generateEmbed(page)],
        components: [row.setComponents(
          new ButtonBuilder()
            .setCustomId('prev_page')
            .setLabel('⬅️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('next_page')
            .setLabel('➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages - 1)
        )],
      });
    });

    collector.on('end', () => {
      message.edit({ components: [] }); // Убираем кнопки после завершения времени действия
    });
  },
};
