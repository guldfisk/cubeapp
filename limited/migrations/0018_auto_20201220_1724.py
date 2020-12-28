# Generated by Django 3.1.3 on 2020-12-20 17:24

from django.db import migrations, models
import utils.fields

from mtgorp.models.tournaments.matches import FirstToN
from mtgorp.models.tournaments.tournaments import AllMatches, Tournament


class Migration(migrations.Migration):
    dependencies = [
        ('limited', '0017_auto_20201218_1221'),
    ]

    operations = [
        migrations.AddField(
            model_name = 'limitedsession',
            name = 'match_type',
            field = utils.fields.SerializeableField(default = FirstToN(2), klass = 'mtgorp.models.tournaments.matches.MatchType'),
            preserve_default = False,
        ),
        migrations.AddField(
            model_name = 'limitedsession',
            name = 'tournament_config',
            field = models.JSONField(default = {}),
            preserve_default = False,
        ),
        migrations.AddField(
            model_name = 'limitedsession',
            name = 'tournament_type',
            field = utils.fields.StringMapField(mapping = Tournament.tournaments_map, default = lambda: AllMatches, max_length = 255),
            preserve_default = False,
        ),
    ]
