# Generated by Django 3.1.3 on 2020-12-18 12:21

from django.db import migrations, models
import django.db.models.deletion
import tournaments.models
import utils.fields


class Migration(migrations.Migration):

    dependencies = [
        ('tournaments', '0002_tournamentparticipant_seed'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tournamentwinner',
            name='result',
        ),
        migrations.AddField(
            model_name='tournamentwinner',
            name='tournament',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='results', to='tournaments.tournament'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='scheduledmatch',
            name='round',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='tournaments.tournamentround'),
        ),
        migrations.AlterField(
            model_name='tournament',
            name='state',
            field=utils.fields.EnumField(default=tournaments.models.Tournament.TournamentState['ONGOING'], enum_type='tournaments.models.TournamentState'),
        ),
        migrations.AlterField(
            model_name='tournamentwinner',
            name='participant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='wins', to='tournaments.tournamentparticipant'),
        ),
    ]
