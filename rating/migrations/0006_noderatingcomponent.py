# Generated by Django 3.1.3 on 2021-03-19 11:56

import api.fields.orp
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('rating', '0005_ratingmap_parent'),
    ]

    operations = [
        migrations.CreateModel(
            name='NodeRatingComponent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node', api.fields.orp.OrpField(model_type='magiccube.laps.traps.tree.printingtree.CardboardNode')),
                ('node_id', models.CharField(max_length=2047)),
                ('example_node', api.fields.orp.OrpField(model_type='magiccube.laps.traps.tree.printingtree.PrintingNode')),
                ('rating_component', models.PositiveSmallIntegerField()),
                ('rating_map', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='node_rating_components', to='rating.ratingmap')),
            ],
            options={
                'ordering': ('-rating_component',),
                'unique_together': {('node_id', 'rating_map')},
            },
        ),
    ]