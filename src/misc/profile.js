const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { embedcolor } = require('../../config.json');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Просмотр профиля участника')
    .addUserOption(option =>
      option.setName('участник')
        .setDescription('Участник, профиль которого вы хотите просмотреть')
    ),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('участник') || interaction.user;
      const member = await interaction.guild.members.fetch(user.id); // Получаем объект GuildMember

      const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
      const createdAt = user.createdAt ? user.createdAt.toLocaleDateString('ru-RU', dateOptions) : 'Неизвестно';
      const joinedAt = member.joinedAt ? member.joinedAt.toLocaleDateString('ru-RU', dateOptions) : 'Неизвестно'; // Используем joinedAt на объекте GuildMember
      const status = member.presence?.activities[0]?.state || 'Не задан'; // Используем объект GuildMember для получения статуса

      // Create canvas
      const canvas = Canvas.createCanvas(700, 250);
      const ctx = canvas.getContext('2d');

      // Load custom background image
      const customBackgroundPath = path.resolve(__dirname, '../../profile/profile.jpg');
      const customBackground = await Canvas.loadImage(customBackgroundPath);

      // Draw custom background image
      ctx.drawImage(customBackground, 0, 0, canvas.width, canvas.height);

      // Draw rounded avatar
      const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: 'jpg' }));
      ctx.save();
      ctx.beginPath();
      ctx.arc(125, 125, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 25, 25, 200, 200);
      ctx.restore();

      // Text information
      ctx.fillStyle = '#ffffff';
      ctx.font = '30px Arial'; // Use Arial font
      ctx.fillText(user.tag, 250, 60);
      ctx.font = '20px Arial';
      ctx.fillText(`ID: ${user.id}`, 250, 100);
      ctx.fillText(`Статус: ${status}`, 250, 130);
      ctx.fillText(`Регистрация: ${createdAt}`, 250, 160);
      ctx.fillText(`Добавился в ДС: ${joinedAt}`, 250, 190);

      // Save image to buffer
      const buffer = canvas.toBuffer('image/png');

      // Create attachment
      const attachment = new AttachmentBuilder(buffer, { name: 'profile-image.png' });

      // Create embed with custom image
      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setImage('attachment://profile-image.png')
        .setFooter({ text: `Команду запросил: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
       .setTimestamp();

      await interaction.followUp({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error(error);
      interaction.followUp('Произошла ошибка при получении информации о профиле.');
    }
  },
};
