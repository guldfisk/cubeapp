# Generated by Django 2.2.5 on 2019-10-07 13:21

import api.fields.orp
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_auto_20191007_1258'),
    ]

    operations = [
        migrations.AlterField(
            model_name='constrainednodes',
            name='constrained_nodes',
            field=api.fields.orp.OrpField(model_type='magiccube.collections.nodecollection.NodeCollection'),
        ),
        migrations.AlterField(
            model_name='constrainednodes',
            name='group_map',
            field=api.fields.orp.OrpField(model_type='magiccube.collections.nodecollection.GroupMap'),
        ),
    ]
