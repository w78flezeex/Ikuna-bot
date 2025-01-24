const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json'); // Подключаем ключ для Genius API из config.json

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Просмотреть текущую песню'),
  
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guild.id);

    if (!queue) {
      return interaction.reply({ content: 'Сейчас музыка не играет.', ephemeral: true });
    }

    const song = queue.songs[0];
    const isLive = song.isLive;
    const totalDuration = song.duration ? song.duration * 1000 : "ненайдено";
    const currentTime = queue.currentTime ? queue.currentTime * 1000 : "ненайдено";
    const progress = Math.floor((currentTime / totalDuration) * 10);
    const empty = '🔲';
    const filledStart = '✅';
    const emptyLine = '🔲';
    const filledLine = '✅';
    const emptyEnd = '🔲';
    const filledEnd = '✅';

    const progressBar = isLive ? '🔴 Эфир' : `${progress > 0 ? filledStart : empty}${filledLine.repeat(progress)}${emptyLine.repeat(10 - progress)}${progress === 10 ? filledEnd : emptyEnd}`;
    const voiceChannel = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;
    
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `${interaction.user}, я уже проигрываю песню в другом голосовом канале, присоединяйся к нам! <#${botVoiceChannel.id}>`,
        ephemeral: true
      });
    }
    
    if (!voiceChannel) {
      return interaction.reply({ content: `${interaction.user}, Сначала вы должены присоединиться к голосовому каналу!`, ephemeral: true });
    }

    const loopStatus = queue.repeatMode === 2 ? 'Очередь' : queue.repeatMode === 1 ? 'Песня' : 'Выключено';
    const filters = queue.filters.length > 0 ? queue.filters.join(', ') : 'Выключено';

    const embed = new EmbedBuilder()
    .setTitle('🎧 Сейчас играет 🎧')
    .setDescription(song.name ? `[${song.name}](${song.url || 'https://shiru.ru'})` : 'Название песни не найдено')
    .addFields(
      { name: 'Запросил', value: song.user.tag || 'Неизвестен', inline: true },
      { name: 'Продолжительность', value: song.formattedDuration || 'Неизвестна', inline: true },
      { name: 'Громкость', value: `${queue.volume || 0}%`, inline: true },
      { name: 'Зацикливание', value: loopStatus || 'Выключено', inline: true },
      { name: 'Фильтры', value: filters || 'Выключено', inline: true },
      { name: 'Прогресс', value: queue.paused ? 'На паузе' : `${progressBar} [${queue.formattedCurrentTime || '0:00'}/${song.formattedDuration || '0:00'}]`, inline: false }
    )
    .setThumbnail(song.thumbnail || 'https://cdn.discordapp.com/avatars/1200794422397378600/a_5190075ab6ca7d43e74805c59023138d.gif?size=4096')
      .setColor(embedcolor);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('previous_song')
          .setEmoji('<:12534200402509865661:1273219664964747307>')
          .setStyle(ButtonStyle.Secondary),
        queue.paused
          ? new ButtonBuilder()
              .setCustomId('pause_resume')
              .setEmoji('<:resume:1253420032394924122>')
              .setStyle(ButtonStyle.Secondary)
          : new ButtonBuilder()
              .setCustomId('pause_resume')
              .setEmoji('<:pause:1253420045762035804>')
              .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('skip_song')
          .setEmoji('<:skip:1253420040250986566>')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('volume_down')
          .setEmoji('<:vol_low:1253420050564649001>')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('volume_up')
          .setEmoji('<:vol_high:1253420044482904085>')
          .setStyle(ButtonStyle.Secondary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('loop_queue')
          .setEmoji('<:looped:1253420047024521316>')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('loop_song')
          .setEmoji('<:looped:1253420047024521316>')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('remove_loop')
          .setEmoji('<:noloop:1253420053668303018>')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('refresh')
          .setEmoji('<:replay:1253420051718078656>')
          .setStyle(ButtonStyle.Secondary),
      );

    const components = [row, row2];
    const message = await interaction.reply({ embeds: [embed], components, fetchReply: true });

    const filter = (btnInteraction) => btnInteraction.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (btnInteraction) => {
      if (!queue || !queue.songs[0]) {
        return btnInteraction.reply({ content: 'Музыка больше не играет.', ephemeral: true });
      }

      switch (btnInteraction.customId) {
        case 'previous_song':
          if (queue.previousSongs.length === 0) {
            return btnInteraction.reply({ content: 'Предыдущая песня не найдена.', ephemeral: true });
          }
          distube.previous(interaction.guild.id);
          await btnInteraction.update({ content: '⏪ Предыдущая песня!', embeds: [embed], components });
          break;

        case 'pause_resume':
          if (queue.paused) {
            distube.resume(interaction.guild.id);
            embed.data.fields[5].value = `${progressBar} [${queue.formattedCurrentTime}/${song.formattedDuration}]`;
            const newButton = new ButtonBuilder()
              .setCustomId('pause_resume')
              .setEmoji('<:pause:1253420045762035804>')
              .setStyle(ButtonStyle.Secondary);

            row.components[1] = newButton;
            await btnInteraction.update({ content: '✅ Музыка возобновлена!', embeds: [embed], components });
          } else {
            distube.pause(interaction.guild.id);
            embed.data.fields[5].value = 'На паузе';
            const newButton = new ButtonBuilder()
              .setCustomId('pause_resume')
              .setEmoji('<:resume:1253420032394924122>')
              .setStyle(ButtonStyle.Secondary);

            row.components[1] = newButton;
            await btnInteraction.update({ content: '⏸ Музыка поставлена на паузу!', embeds: [embed], components });
          }
          break;

        case 'skip_song':
          if (queue.songs.length <= 1) {
            return btnInteraction.reply({ content: 'Следующая песня не найдена.', ephemeral: true });
          }
          distube.skip(interaction.guild.id);
          await btnInteraction.update({ content: '⏭ Песня пропущена!', embeds: [embed], components });
          break;

        case 'volume_down':
          const newVolumeDown = Math.max(queue.volume - 10, 0);
          queue.setVolume(newVolumeDown);
          embed.data.fields[2].value = `${newVolumeDown}%`;
          await btnInteraction.update({ content: `🔈 Громкость уменьшена до ${newVolumeDown}%`, embeds: [embed], components });
          break;

        case 'volume_up':
          const newVolumeUp = Math.min(queue.volume + 10, 100);
          queue.setVolume(newVolumeUp);
          embed.data.fields[2].value = `${newVolumeUp}%`;
          await btnInteraction.update({ content: `🔊 Громкость увеличена до ${newVolumeUp}%`, embeds: [embed], components });
          break;

        case 'loop_queue':
          distube.setRepeatMode(queue, 2);
          embed.data.fields[3].value = 'Очередь';
          await btnInteraction.update({ content: '✅ Очередь зациклена!', embeds            : [embed], components });
          break;

        case 'loop_song':
          distube.setRepeatMode(queue, 1);
          embed.data.fields[3].value = 'Песня';
          await btnInteraction.update({ content: '✅ Песня зациклена!', embeds: [embed], components });
          break;

        case 'remove_loop':
          distube.setRepeatMode(queue, 0);
          embed.data.fields[3].value = 'Выключено';
          await btnInteraction.update({ content: '✅ Зацикливание выключено!', embeds: [embed], components });
          break;

        case 'refresh':
          await btnInteraction.update({ content: '✅ Обновлено!', embeds: [embed], components });
          break;
            default:
              await btnInteraction.reply({ content: 'Неизвестное действие.', ephemeral: true });
              break;
            }            
        });          

    collector.on('end', async () => {
      if (message) {
        await message.edit({ components: [] });
      }
    });
  }
};
