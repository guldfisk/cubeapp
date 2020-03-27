# Generated by Django 3.0.4 on 2020-03-13 14:08

import api.fields.orp
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import draft.models
import utils.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('limited', '0003_auto_20200312_1538'),
    ]

    operations = [
        migrations.CreateModel(
            name='DraftSession',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('started_at', models.DateTimeField(auto_now_add=True)),
                ('key', models.CharField(max_length=255)),
                ('ended_at', models.DateTimeField(null=True)),
                ('draft_format', models.CharField(max_length=127)),
                ('state', utils.fields.EnumField(default=draft.models.DraftSession.DraftState['DRAFTING'], enum_type='draft.models.DraftState')),
                ('limited_session', models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='draft_session', to='limited.LimitedSession')),
                ('pool_specification', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='draft_sessions', to='limited.PoolSpecification')),
            ],
        ),
        migrations.CreateModel(
            name='DraftPick',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('pack_number', models.PositiveSmallIntegerField()),
                ('pick_number', models.PositiveSmallIntegerField()),
                ('pack', api.fields.orp.OrpField(model_type='mtgdraft.models.Booster')),
                ('pick', api.fields.orp.OrpField(model_type='mtgdraft.models.Pick')),
                ('drafter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='picks', to='draft.DraftSession')),
            ],
        ),
        migrations.CreateModel(
            name='DraftParticipant',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sequence_number', models.PositiveSmallIntegerField()),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='drafters', to='draft.DraftSession')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='drafters', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
