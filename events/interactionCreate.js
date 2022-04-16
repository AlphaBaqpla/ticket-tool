let hastebin = require('hastebin');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: 'Вы уже создали Тикет!',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`тикет-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `Тикет создан! <#${c.id}>`,
          ephemeral: true
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('7df0c4')
          .setAuthor('Ticket-Tools', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
          .setDescription('Выберите категорию Тикета')
          .setFooter('LifeWell.fun', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
          .setTimestamp();

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Выбор Категории')
            .addOptions([{
                label: 'Задонатить',//❤️🧡💛💚💙💜🤎🖤🤍
                value: 'donate',
                emoji: '💛',
              },
              {
                label: 'Получить Проходку',
                value: 'проходка',
                emoji: '🖤',
              },
              {
                label: 'Общие Вопросы',
                value: 'вопросы',
                emoji: '💙',
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('7df0c4')
                  .setAuthor('Ticket-Tools', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
                  .setDescription(`<@!${interaction.user.id}> создал тикет ${i.values[0]}`)
                  .setFooter('ExoHost.fr', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Закрыть Тикет')
                    .setEmoji('899745362137477181')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
            if (i.values[0] == 'donate') {
              c.edit({
                parent: client.config.parentTransactions
              });
            };
            if (i.values[0] == 'проходка') {
              c.edit({
                parent: client.config.parentJeux
              });
            };
            if (i.values[0] == 'вопросы') {
              c.edit({
                parent: client.config.parentAutres
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Категория тикета не была выбрана, тикет будет закрыт...`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 5000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Закрытие Тикета...')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Отменить закрытие')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Вы точно хотите закрыть тикет ?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Тикет закрыт <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('7df0c4')
                .setAuthor('Ticket-Tools', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
                .setDescription('```Контроль Тикетов```')
                .setFooter('ExoHost.fr', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
                .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Удалить тикет')
                  .setEmoji('🗑️')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'Удаление отменено!',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Закрытие законченного Тикета',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: 'Сохранение сообщений...'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('fr-FR')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Nothing"
        hastebin.createPaste(a, {
            contentType: 'text/plain',
            server: 'https://hastebin.com/'
          }, {})
          .then(function (urlToPaste) {
            const embed = new client.discord.MessageEmbed()
              .setAuthor('Logs Ticket', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
              .setDescription(`📰 Лог тикета \`${chan.id}\` создано <@!${chan.topic}> уалено <@!${interaction.user.id}>\n\nЛог: [**Посмотреть Лог**](${urlToPaste})`)
              .setColor('2f3136')
              .setTimestamp();

            const embed2 = new client.discord.MessageEmbed()
              .setAuthor('Logs Ticket', 'https://cdn.discordapp.com/attachments/962670723111981126/964794332764860436/icons8--512.png')
              .setDescription(`📰 Лог удалеённого тикета \`${chan.id}\`: [**Посмотреть Лог**](${urlToPaste})`)
              .setColor('2f3136')
              .setTimestamp();

            client.channels.cache.get(client.config.logsTicket).send({
              embeds: [embed]
            });
            client.users.cache.get(chan.topic).send({
              embeds: [embed2]
            }).catch(() => {console.log('Я не могу отправить вам личное сообщение <:cry:809448299538939937>')});
            chan.send('Удаленр канала...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
      });
    };
  },
};
