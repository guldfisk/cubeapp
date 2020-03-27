from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('draft', '0003_auto_20200324_1150'),
    ]

    operations = [
        migrations.RenameModel(
            old_name = 'DraftParticipant',
            new_name = 'DraftSeat',
        ),
        migrations.RenameField(
            model_name = 'DraftPick',
            old_name = 'drafter',
            new_name = 'seat',
        ),
    ]
