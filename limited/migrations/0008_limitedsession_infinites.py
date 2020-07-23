# Generated by Django 3.0.8 on 2020-07-22 13:38

import api.fields.orp
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('limited', '0007_auto_20200413_1843'),
    ]

    operations = [
        migrations.AddField(
            model_name='limitedsession',
            name='infinites',
            field=api.fields.orp.OrpField(
                default = {"cardboards": ["Plains", "Forest", "Mountain", "Swamp", "Island", "Wastes"]},
                model_type='magiccube.collections.infinites.Infinites',
            ),
            preserve_default=False,
        ),
    ]
