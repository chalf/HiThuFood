from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Avg, signals
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings


class User(AbstractUser):
    avatar = CloudinaryField()
    created_date = models.DateTimeField(auto_now_add=True)
    phone_number = models.CharField(max_length=12, unique=True)
    is_staff = models.BooleanField(default=False)
    # cho biết là tài khoản người dùng cá nhân hay không, False la nguoi dung ca nhan
    is_store_owner = models.BooleanField(default=False)
    # cho biết là tài khoản vai trò cửa hàng hay không
    # Cần admin xác nhân mới đc là True
    is_male = models.BooleanField(null=False, default=True)
    # True la Nam
    followed_stores = models.ManyToManyField('Store', through='UserFollowedStore',
                                             related_name='followers', blank=True, null=True)

    def __str__(self):
        return self.username

    # mục đích của gender() là hiển thị Nam/Nữ trên admin site thay vì 1/0
    def gender(self):
        if self.is_male is True:
            return 'Nam'
        return 'Nữ'
    # Lỗi hiển thị: khi tạo user, mặc dù khai báo gender: 1, nhưng nó hiển thị gender là Nữ
    # Nó chỉ hiện thị thế thôi, chứ trong database sẽ là 1 (Nam)
    # Lí do là khi bấm Send trên Postman tạo user, thì lúc hiển thị, nó vẫn chưa lưu xuống database
    # nên is_male == None, => ko return 'Nam' được, => return 'Nữ'
    # ---> FIXED: trong serializer.py thêm phương thức get_gender


class BaseItem(models.Model):
    name = models.CharField(unique=True, max_length=255, null=False)
    created_date = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    class Meta:
        abstract = True


class Store(BaseItem):
    description = models.TextField(blank=True, null=True)
    avatar = CloudinaryField()
    active = models.BooleanField(default=False)
    # can admin accept
    average_rating = models.FloatField(blank=True, null=True)
    # user nào là chủ cửa hàng
    user = models.OneToOneField(User, on_delete=models.CASCADE,
                                related_name='store', null=True, blank=True)
    address_line = models.CharField(max_length=255, default='Ho Chi Minh City')
    X = models.CharField(max_length=20, null=True)
    Y = models.CharField(max_length=20, null=True)

    def __str__(self):
        return self.name


# Xử lý admin gán Store.active = true thì user mà nó có khóa ngoại sẽ tự động gán is_store_owner = true
# khi admin cập nhật trường active trên adminsite
# Signal handler
@receiver(signals.post_save, sender=Store)
def set_store_owner(sender, instance, **kwargs):
    if instance.active:
        user = instance.user
        user.is_store_owner = True
        user.is_staff = True
        user.save()
        send_mail('Chúc mừng! Cửa hàng của bạn đã được kích hoạt',
                  f'''Xin chào {user.first_name} {user.last_name},

Chúc mừng! Chúng tôi rất vui thông báo rằng cửa hàng của bạn trên hệ thống HiThuFood của chúng tôi đã được kích hoạt thành công.

Cửa hàng của bạn hiện đã có thể hoạt động và bạn có thể bắt đầu bán hàng ngay lập tức. Đừng ngần ngại liên hệ với chúng tôi nếu bạn cần bất kỳ sự hỗ trợ nào trong quá trình này.

Xin cảm ơn bạn đã tham gia vào cộng đồng của chúng tôi và chúc bạn một ngày tốt lành!

Trân trọng,
HiThuFood''',
                  from_email=settings.EMAIL_HOST_USER,
                  recipient_list=[user.email],
                  fail_silently=False  # thất bại thì im lặng? = True nếu muốn nó ko thông báo khi gởi mail thâất bại
                  )


# Connect the signal
signals.post_save.connect(set_store_owner, sender=Store)


class UserFollowedStore(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='storesthatuserfollowed')
    store = models.ForeignKey(Store, on_delete=models.CASCADE)
    followed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'store')


# User đánh giá Store
class Comment(models.Model):
    users = models.ForeignKey(User, on_delete=models.CASCADE)
    stores = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='comments')
    rating = models.PositiveSmallIntegerField(default=5)
    content = models.TextField(null=True, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)


@receiver(signals.post_save, sender=Comment)
def update_average_rating(sender, instance, **kwargs):
    store = instance.stores

    # Lấy tất cả các comment của store hiện tại mà user comment
    comments = Comment.objects.filter(stores=store)

    # Tính tổng và số lượng rating
    total_rating = sum(comment.rating for comment in comments)
    count = comments.count()

    # Tính average rating
    store.average_rating = total_rating / count if count > 0 else 0
    store.save()


signals.post_save.connect(update_average_rating, sender=Comment)


class Address(models.Model):
    # Dòng địa chỉ đầy đủ
    address_line = models.CharField(max_length=255)
    X = models.CharField(max_length=20, null=True)
    Y = models.CharField(max_length=20, null=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='addresses', null=True)

    def __str__(self):
        return self.address_line


class Food(BaseItem):
    name = models.CharField(unique=False, max_length=255, null=False)
    image = CloudinaryField()
    description = models.TextField(blank=True, null=True)
    price = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0)
    discount = models.IntegerField(default=0)
    times = models.ManyToManyField('SellingTime', null=True, blank=True, related_name='dishes')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='foods', null=True)
    category = models.ManyToManyField('Category', null=True)
    users_review = models.ManyToManyField(User, through='Review', blank=True, null=True)

    def __str__(self):
        return self.name


# thong bao cho cac user dang follow khi co food moi
@receiver(signals.post_save, sender=Food)
def notification(sender, instance, **kwargs):
    user_follow_store = UserFollowedStore.objects.filter(store=instance.store)
    for i in range(user_follow_store.count()):

        send_mail(f'Bạn ơi, cửa hàng {user_follow_store[i].store.name} có món mới!',
                  f'''Xin chào {user_follow_store[i].user.first_name} {user_follow_store[i].user.last_name},

Cửa hàng {user_follow_store[i].store.name} mà bạn theo dõi đã có món mới! Hãy nhanh tay khám phá và thưởng thức những món ăn ngon mới nhất từ {user_follow_store[i].store.name}.

------------------------------------------------------------

Thông tin món:
Tên món: {instance.name}

Mô tả: {instance.description}

Giá món: {instance.price}

Ngoài ra, {user_follow_store[i].store.name} còn có nhiều món ngon khác đang chờ bạn khám phá.

Thân mến,
HiThuFood''',
                  from_email=settings.EMAIL_HOST_USER,
                  recipient_list=[user_follow_store[i].user.email],
                  fail_silently=False)


# Connect the signal
signals.post_save.connect(notification, sender=Food)


class SellingTime(models.Model):
    name = models.CharField(max_length=50, )
    start = models.TimeField()
    end = models.TimeField()

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CANCELLED', 'Cancelled'),
        ('DELIVERING', 'Delivering'),
        ('DELIVERED', 'Delivered'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='orders_by_user')
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, related_name='orders_for_store')
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='PENDING')
    order_date = models.DateTimeField(auto_now_add=True)
    total = models.IntegerField(null=True)
    shipping_fee = models.IntegerField(null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food = models.ForeignKey(Food, on_delete=models.SET_NULL, null=True)
    # PositiveIntegerField chỉ nhận số không âm
    quantity = models.PositiveIntegerField(default=1)
    unit_price_at_order = models.IntegerField()


class Order_Item_Topping(models.Model):
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name='order_item_topping')
    topping = models.ForeignKey('Topping', on_delete=models.SET_NULL, null=True)
    unit_price_at_order = models.IntegerField(null=True)


# user danh gia mon an
class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(default=5)
    comment = models.TextField(blank=True)
    image = CloudinaryField()
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        # 1 user chỉ đánh giá 1 lần
        unique_together = ('user', 'food')


@receiver(signals.post_save, sender=Review)
def update_average_rating(sender, instance, **kwargs):
    food = instance.food

    reviews = Review.objects.filter(food=food)

    total_rating = sum(review.rating for review in reviews)
    count = reviews.count()

    # Tính average rating
    food.average_rating = total_rating / count if count > 0 else 0
    food.save()


signals.post_save.connect(update_average_rating, sender=Review)


class Topping(models.Model):
    name = models.CharField(max_length=200)
    price = models.IntegerField(default=0)
    food = models.ForeignKey(Food, on_delete=models.CASCADE, related_name='toppings')

    def __str__(self):
        return self.name
