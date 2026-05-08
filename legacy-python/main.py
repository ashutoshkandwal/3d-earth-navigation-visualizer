import tkinter as tk
import math
import random

WIDTH = 750
HEIGHT = 750
CENTER = (WIDTH // 2, HEIGHT // 2)
RADIUS = 300
EQUATOR_SCALE = 0.98
STAR_COUNT = 80
STAR_COLORS = ['#ffffff']
starfield = []

INITIAL_ANGLE_X = -1.2
INITIAL_ANGLE_Y = 0.2
INITIAL_ANGLE_Z = 0.0

angle_x = INITIAL_ANGLE_X
angle_y = INITIAL_ANGLE_Y
angle_z = INITIAL_ANGLE_Z
last_pos = None

root = tk.Tk()
root.title('Earth 3D Model')

show_latitudes = False
show_meridians = False
free_rotation = False
navigation_mode = 'terrestrial'
position_a_var = tk.BooleanVar(value=False)
lat_deg_var = tk.StringVar(value='20')
lat_min_var = tk.StringVar(value='00.00')
lat_ns_var = tk.StringVar(value='N')
lon_deg_var = tk.StringVar(value='040')
lon_min_var = tk.StringVar(value='00.00')
lon_ew_var = tk.StringVar(value='E')
drag_mode = None
_value_validate_block = False


def clamp_latitude(deg, minutes):
    if minutes >= 60.0:
        extra = int(minutes // 60)
        minutes -= extra * 60.0
        deg += extra
    elif minutes < 0.0:
        extra = int(math.ceil(abs(minutes) / 60.0))
        minutes += extra * 60.0
        deg -= extra
    deg = max(0, min(90, deg))
    if deg >= 90:
        deg = 90
        minutes = 0.0
    elif deg <= 0:
        deg = 0
        minutes = 0.0
    return deg, minutes


def clamp_longitude(deg, minutes):
    if minutes >= 60.0:
        extra = int(minutes // 60)
        minutes -= extra * 60.0
        deg += extra
    elif minutes < 0.0:
        extra = int(math.ceil(abs(minutes) / 60.0))
        minutes += extra * 60.0
        deg -= extra
    deg = max(0, min(180, deg))
    if deg >= 180:
        deg = 180
        minutes = 0.0
    elif deg <= 0:
        deg = 0
        minutes = 0.0
    return deg, minutes


def format_lat_deg(value):
    return f'{int(value):02d}'


def format_lon_deg(value):
    return f'{int(value):03d}'


def format_minutes(value):
    return f'{value:05.2f}'


def validate_degree_entry(value, max_value, width):
    if value == '':
        return True
    if not value.isdigit():
        return False
    if len(value) > width:
        return False
    try:
        return int(value) <= max_value
    except ValueError:
        return False


def validate_minutes_entry(value):
    if value == '':
        return True
    if value.count('.') > 1:
        return False
    parts = value.split('.')
    if parts[0] != '' and not parts[0].isdigit():
        return False
    if len(parts[0]) > 2:
        return False
    if len(parts) == 2:
        if not parts[1].isdigit():
            return False
        if len(parts[1]) > 2:
            return False
    return True


def normalize_position_vars(event=None):
    global _value_validate_block
    if _value_validate_block:
        return
    _value_validate_block = True
    try:
        try:
            lat_deg = int(lat_deg_var.get().strip())
        except Exception:
            lat_deg = 0
        try:
            lat_min = float(lat_min_var.get().strip().replace(',', '.'))
        except Exception:
            lat_min = 0.0
        try:
            lon_deg = int(lon_deg_var.get().strip())
        except Exception:
            lon_deg = 0
        try:
            lon_min = float(lon_min_var.get().strip().replace(',', '.'))
        except Exception:
            lon_min = 0.0

        lat_deg, lat_min = clamp_latitude(lat_deg, lat_min)
        lon_deg, lon_min = clamp_longitude(lon_deg, lon_min)

        lat_deg_var.set(format_lat_deg(lat_deg))
        lat_min_var.set(format_minutes(lat_min))
        lon_deg_var.set(format_lon_deg(lon_deg))
        lon_min_var.set(format_minutes(lon_min))

        if lat_ns_var.get().upper() not in ('N', 'S'):
            lat_ns_var.set('N')
        if lon_ew_var.get().upper() not in ('E', 'W'):
            lon_ew_var.set('E')
    finally:
        _value_validate_block = False


def select_all_text(event):
    event.widget.after(1, lambda: event.widget.select_range(0, 'end'))


def update_position_visibility():
    if position_a_var.get():
        position_inputs_frame.pack(fill='x', padx=10, pady=(4, 10))
    else:
        position_inputs_frame.pack_forget()



def create_starfield():
    global starfield
    starfield = []
    for _ in range(STAR_COUNT):
        x = random.randint(0, WIDTH)
        y = random.randint(0, HEIGHT)
        radius = random.choice([1, 1, 2])
        color = random.choice(STAR_COLORS)
        starfield.append((x, y, radius, color))


def toggle_latitudes():
    global show_latitudes
    show_latitudes = not show_latitudes
    toggle_latitudes_button.config(text='Hide all parallel of latitudes' if show_latitudes else 'Show all parallel of latitudes')
    redraw()


def toggle_meridians():
    global show_meridians
    show_meridians = not show_meridians
    toggle_meridians_button.config(text='Hide all meridians' if show_meridians else 'Show all meridians')
    redraw()


def toggle_navigation_mode():
    global navigation_mode
    navigation_mode = 'celestial' if navigation_mode == 'terrestrial' else 'terrestrial'
    toggle_navigation_button.config(
        text='Switch to terrestrial navigation' if navigation_mode == 'celestial' else 'Switch to celestial navigation'
    )
    redraw()


def toggle_free_rotation():
    global free_rotation, angle_x, angle_y, angle_z
    free_rotation = not free_rotation
    if not free_rotation:
        angle_x = INITIAL_ANGLE_X
        angle_y = 0.0
        angle_z = INITIAL_ANGLE_Z
    toggle_free_rotation_button.config(
        text='free rotation/til: On' if free_rotation else 'free rotation/til: Off'
    )
    redraw()

root.configure(bg='black')
button_frame = tk.Frame(root, bg='#0b0f1c')
button_frame.pack(side='bottom', fill='x', pady=(0, 10))
toggle_latitudes_button = tk.Button(
    button_frame,
    text='Show all parallel of latitudes',
    command=toggle_latitudes,
    bg='#101820',
    fg='white',
    activebackground='#243b6d',
    activeforeground='white',
    relief='flat',
    bd=0,
    padx=12,
    pady=8,
)
toggle_latitudes_button.pack(side='left', padx=10, pady=10)

toggle_meridians_button = tk.Button(
    button_frame,
    text='Show all meridians',
    command=toggle_meridians,
    bg='#101820',
    fg='white',
    activebackground='#243b6d',
    activeforeground='white',
    relief='flat',
    bd=0,
    padx=12,
    pady=8,
)
toggle_meridians_button.pack(side='left', padx=10, pady=10)

toggle_navigation_button = tk.Button(
    button_frame,
    text='Switch to celestial navigation',
    command=toggle_navigation_mode,
    bg='#101820',
    fg='white',
    activebackground='#243b6d',
    activeforeground='white',
    relief='flat',
    bd=0,
    padx=12,
    pady=8,
)
toggle_navigation_button.pack(side='left', padx=10, pady=10)

toggle_free_rotation_button = tk.Button(
    button_frame,
    text='free rotation/til: Off',
    command=toggle_free_rotation,
    bg='#101820',
    fg='white',
    activebackground='#243b6d',
    activeforeground='white',
    relief='flat',
    bd=0,
    padx=12,
    pady=8,
)
toggle_free_rotation_button.pack(side='left', padx=10, pady=10)

canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg='black', highlightthickness=0)
canvas.pack(side='top', fill='both', expand=True)

position_frame = tk.Frame(root, bg='#101820')
position_frame.place(relx=1.0, x=-10, y=10, anchor='ne')

position_toggle_button = tk.Checkbutton(
    position_frame,
    text='Position A',
    variable=position_a_var,
    command=update_position_visibility,
    bg='#101820',
    fg='white',
    selectcolor='#101820',
    activebackground='#243b6d',
    activeforeground='white',
    relief='flat',
    bd=0,
    indicatoron=False,
    padx=10,
    pady=6,
)
position_toggle_button.pack(fill='x')

position_inputs_frame = tk.Frame(position_frame, bg='#101820')

position_header = tk.Frame(position_inputs_frame, bg='#101820')
position_header.grid(row=0, column=0, columnspan=6, sticky='w')

lat_label = tk.Label(position_inputs_frame, text='Latitude', bg='#101820', fg='white')
lat_label.grid(row=0, column=0, columnspan=3, sticky='w')

lon_label = tk.Label(position_inputs_frame, text='Longitude', bg='#101820', fg='white')
lon_label.grid(row=0, column=3, columnspan=3, sticky='w', padx=(10, 0))

headers = ['deg', 'min', 'N/S', 'deg', 'min', 'E/W']
for index, label_text in enumerate(headers):
    tk.Label(
        position_inputs_frame,
        text=label_text,
        bg='#101820',
        fg='#cccccc',
        font=('Arial', 8),
    ).grid(row=1, column=index, padx=2, pady=(4, 2))

validate_lat_deg = (root.register(lambda value: validate_degree_entry(value, 90, 2)), '%P')
validate_lon_deg = (root.register(lambda value: validate_degree_entry(value, 180, 3)), '%P')
validate_minutes = (root.register(validate_minutes_entry), '%P')

lat_deg_spin = tk.Spinbox(
    position_inputs_frame,
    from_=0,
    to=90,
    increment=1,
    textvariable=lat_deg_var,
    width=2,
    justify='center',
    validate='key',
    validatecommand=validate_lat_deg,
    command=normalize_position_vars,
    bg='#1a1f2c',
    fg='white',
    insertbackground='white',
    relief='flat',
)
lat_deg_spin.grid(row=2, column=0, padx=2, pady=2)
lat_deg_spin.bind('<FocusIn>', select_all_text)
lat_deg_spin.bind('<ButtonRelease-1>', select_all_text)
lat_deg_spin.bind('<FocusOut>', normalize_position_vars)

lat_min_spin = tk.Spinbox(
    position_inputs_frame,
    from_=0.00,
    to=59.99,
    increment=0.01,
    format='%.2f',
    textvariable=lat_min_var,
    width=6,
    justify='center',
    validate='key',
    validatecommand=validate_minutes,
    command=normalize_position_vars,
    bg='#1a1f2c',
    fg='white',
    insertbackground='white',
    relief='flat',
)
lat_min_spin.grid(row=2, column=1, padx=2, pady=2)
lat_min_spin.bind('<FocusIn>', select_all_text)
lat_min_spin.bind('<ButtonRelease-1>', select_all_text)
lat_min_spin.bind('<FocusOut>', normalize_position_vars)

lat_ns_menu = tk.OptionMenu(position_inputs_frame, lat_ns_var, 'N', 'S', command=lambda _: normalize_position_vars())
lat_ns_menu.configure(bg='#1a1f2c', fg='white', activebackground='#243b6d', activeforeground='white', relief='flat', bd=0)
lat_ns_menu['menu'].configure(bg='#1a1f2c', fg='white')
lat_ns_menu.grid(row=2, column=2, padx=2, pady=2)

lon_deg_spin = tk.Spinbox(
    position_inputs_frame,
    from_=0,
    to=180,
    increment=1,
    textvariable=lon_deg_var,
    width=3,
    justify='center',
    validate='key',
    validatecommand=validate_lon_deg,
    command=normalize_position_vars,
    bg='#1a1f2c',
    fg='white',
    insertbackground='white',
    relief='flat',
)
lon_deg_spin.grid(row=2, column=3, padx=2, pady=2)
lon_deg_spin.bind('<FocusIn>', select_all_text)
lon_deg_spin.bind('<ButtonRelease-1>', select_all_text)
lon_deg_spin.bind('<FocusOut>', normalize_position_vars)

lon_min_spin = tk.Spinbox(
    position_inputs_frame,
    from_=0.00,
    to=59.99,
    increment=0.01,
    format='%.2f',
    textvariable=lon_min_var,
    width=6,
    justify='center',
    validate='key',
    validatecommand=validate_minutes,
    command=normalize_position_vars,
    bg='#1a1f2c',
    fg='white',
    insertbackground='white',
    relief='flat',
)
lon_min_spin.grid(row=2, column=4, padx=2, pady=2)
lon_min_spin.bind('<FocusIn>', select_all_text)
lon_min_spin.bind('<ButtonRelease-1>', select_all_text)
lon_min_spin.bind('<FocusOut>', normalize_position_vars)

lon_ew_menu = tk.OptionMenu(position_inputs_frame, lon_ew_var, 'E', 'W', command=lambda _: normalize_position_vars())
lon_ew_menu.configure(bg='#1a1f2c', fg='white', activebackground='#243b6d', activeforeground='white', relief='flat', bd=0)
lon_ew_menu['menu'].configure(bg='#1a1f2c', fg='white')
lon_ew_menu.grid(row=2, column=5, padx=2, pady=2)


def update_geometry(event=None):
    global WIDTH, HEIGHT, CENTER, RADIUS
    WIDTH = canvas.winfo_width()
    HEIGHT = canvas.winfo_height()
    CENTER = (WIDTH // 2, HEIGHT // 2)
    RADIUS = int(min(WIDTH, HEIGHT) * 0.38)
    if RADIUS < 50:
        RADIUS = 50
    redraw()

canvas.bind('<Configure>', update_geometry)


def rotate_point(x, y, z, ax, az, ay=0.0):
    cosz = math.cos(az)
    sinz = math.sin(az)
    x1 = x * cosz - y * sinz
    y1 = x * sinz + y * cosz

    cosx = math.cos(ax)
    sinx = math.sin(ax)
    y2 = y1 * cosx - z * sinx
    z2 = y1 * sinx + z * cosx

    cosay = math.cos(ay)
    sinay = math.sin(ay)
    x3 = x1 * cosay + z2 * sinay
    z3 = -x1 * sinay + z2 * cosay
    return x3, y2, z3


def project(x, y, z):
    # Simple orthographic projection with slight perspective hint
    scale = 1.0 - (z / (4 * RADIUS))
    return CENTER[0] + x * scale, CENTER[1] - y * scale


def color_for_depth(z, front='white', back='#555555'):
    return front if z >= 0 else back


def sphere_equator_points(count=90):
    points = []
    eq_radius = RADIUS * EQUATOR_SCALE
    for i in range(count + 1):
        theta = 2 * math.pi * i / count
        x = eq_radius * math.cos(theta)
        y = eq_radius * math.sin(theta)
        z = 0
        points.append((x, y, z))
    return points


def sphere_latitude_points(latitude_deg, count=90):
    points = []
    lat_rad = math.radians(latitude_deg)
    lat_z = RADIUS * math.sin(lat_rad)
    lat_radius = RADIUS * math.cos(lat_rad) * EQUATOR_SCALE
    for i in range(count + 1):
        theta = 2 * math.pi * i / count
        x = lat_radius * math.cos(theta)
        y = lat_radius * math.sin(theta)
        points.append((x, y, lat_z))
    return points


def sphere_meridian_points(longitude_deg, count=90):
    points = []
    lon_rad = math.radians(longitude_deg)
    for i in range(count + 1):
        lat = -math.pi / 2 + math.pi * i / count
        x = RADIUS * math.cos(lat) * math.cos(lon_rad) * EQUATOR_SCALE
        y = RADIUS * math.cos(lat) * math.sin(lon_rad) * EQUATOR_SCALE
        z = RADIUS * math.sin(lat)
        points.append((x, y, z))
    return points


def position_a_sphere_point():
    try:
        lat_deg = int(lat_deg_var.get().strip())
    except Exception:
        lat_deg = 0
    try:
        lat_min = float(lat_min_var.get().strip().replace(',', '.'))
    except Exception:
        lat_min = 0.0
    try:
        lon_deg = int(lon_deg_var.get().strip())
    except Exception:
        lon_deg = 0
    try:
        lon_min = float(lon_min_var.get().strip().replace(',', '.'))
    except Exception:
        lon_min = 0.0

    lat_deg, lat_min = clamp_latitude(lat_deg, lat_min)
    lon_deg, lon_min = clamp_longitude(lon_deg, lon_min)

    lat = (lat_deg + lat_min / 60.0) * (1 if lat_ns_var.get().upper() == 'N' else -1)
    lon = (lon_deg + lon_min / 60.0) * (1 if lon_ew_var.get().upper() == 'E' else -1)
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    x = RADIUS * math.cos(lat_rad) * math.cos(lon_rad) * EQUATOR_SCALE
    y = RADIUS * math.cos(lat_rad) * math.sin(lon_rad) * EQUATOR_SCALE
    z = RADIUS * math.sin(lat_rad)
    return x, y, z


def position_a_latlon():
    try:
        lat_deg = int(lat_deg_var.get().strip())
    except Exception:
        lat_deg = 0
    try:
        lat_min = float(lat_min_var.get().strip().replace(',', '.'))
    except Exception:
        lat_min = 0.0
    try:
        lon_deg = int(lon_deg_var.get().strip())
    except Exception:
        lon_deg = 0
    try:
        lon_min = float(lon_min_var.get().strip().replace(',', '.'))
    except Exception:
        lon_min = 0.0
    lat_deg, lat_min = clamp_latitude(lat_deg, lat_min)
    lon_deg, lon_min = clamp_longitude(lon_deg, lon_min)
    lat = (lat_deg + lat_min / 60.0) * (1 if lat_ns_var.get().upper() == 'N' else -1)
    lon = (lon_deg + lon_min / 60.0) * (1 if lon_ew_var.get().upper() == 'E' else -1)
    return lat, lon


def normalize_angle(angle):
    return (angle + math.pi) % (2 * math.pi) - math.pi


def is_between_longitude(theta, lon_a):
    theta = normalize_angle(theta)
    lon_a = normalize_angle(lon_a)
    if lon_a == 0:
        return False
    return theta == 0 or (theta * lon_a > 0 and abs(theta) <= abs(lon_a))


def is_between_latitude(lat, lat_a):
    if lat_a >= 0:
        return 0 <= lat <= lat_a
    return lat_a <= lat <= 0


def sphere_pole_point(north=True):
    z = RADIUS if north else -RADIUS
    return 0.0, 0.0, z


def redraw():
    canvas.delete('all')
    canvas.create_rectangle(0, 0, WIDTH, HEIGHT, fill='black', outline='')

    # Starfield backdrop
    if not starfield:
        create_starfield()
    for sx, sy, sr, scolor in starfield:
        canvas.create_oval(sx, sy, sx + sr, sy + sr, fill=scolor, outline='')

    # Draw sphere body with smooth radial gradient
    for step in range(12):
        fill = f'#{4 + step * 4:02x}{40 + step * 7:02x}{112 + step * 10:02x}'
        radius_step = int(RADIUS - step * (RADIUS * 0.05))
        canvas.create_oval(
            CENTER[0] - radius_step,
            CENTER[1] - radius_step,
            CENTER[0] + radius_step,
            CENTER[1] + radius_step,
            fill=fill,
            outline='',
        )

    # Draw equator as red line wrapped around the sphere, with back segments dull red
    equator = sphere_equator_points(120)
    rotated_equator = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), x, y, z) for x, y, z in equator]
    projected_equator = [(*project(rx, ry, rz), rz) for rx, ry, rz, *_ in rotated_equator]

    for i in range(len(projected_equator) - 1):
        x1, y1, z1 = projected_equator[i]
        x2, y2, z2 = projected_equator[i + 1]
        if z1 >= 0 and z2 >= 0:
            canvas.create_line(x1, y1, x2, y2, fill='red', width=1)
        elif z1 < 0 and z2 < 0:
            canvas.create_line(x1, y1, x2, y2, fill='#550000', width=1)
        else:
            t = abs(z1) / (abs(z1) + abs(z2))
            ix = x1 + (x2 - x1) * t
            iy = y1 + (y2 - y1) * t
            if z1 >= 0:
                canvas.create_line(x1, y1, ix, iy, fill='red', width=1)
                canvas.create_line(ix, iy, x2, y2, fill='#550000', width=1)
            else:
                canvas.create_line(x1, y1, ix, iy, fill='#550000', width=1)
                canvas.create_line(ix, iy, x2, y2, fill='red', width=1)

    if show_latitudes:
        for latitude in range(10, 90, 10):
            for lat_value in (latitude, -latitude):
                lat_circle = sphere_latitude_points(lat_value, 120)
                rotated_lat = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), x, y, z) for x, y, z in lat_circle]
                projected_lat = [(*project(rx, ry, rz), rz) for rx, ry, rz, *_ in rotated_lat]
                for i in range(len(projected_lat) - 1):
                    x1, y1, z1 = projected_lat[i]
                    x2, y2, z2 = projected_lat[i + 1]
                    if z1 >= 0 and z2 >= 0:
                        canvas.create_line(x1, y1, x2, y2, fill='white', width=1)
                    elif z1 < 0 and z2 < 0:
                        canvas.create_line(x1, y1, x2, y2, fill='#555555', width=1)
                    else:
                        t = abs(z1) / (abs(z1) + abs(z2))
                        ix = x1 + (x2 - x1) * t
                        iy = y1 + (y2 - y1) * t
                        if z1 >= 0:
                            canvas.create_line(x1, y1, ix, iy, fill='white', width=1)
                            canvas.create_line(ix, iy, x2, y2, fill='#555555', width=1)
                        else:
                            canvas.create_line(x1, y1, ix, iy, fill='#555555', width=1)
                            canvas.create_line(ix, iy, x2, y2, fill='white', width=1)

    if show_meridians:
        for longitude in range(0, 360, 10):
            meridian = sphere_meridian_points(longitude, 120)
            rotated_meridian = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), longitude) for x, y, z in meridian]
            projected_meridian = [(*project(rx, ry, rz), rz, lon) for rx, ry, rz, lon in rotated_meridian]
            for i in range(len(projected_meridian) - 1):
                x1, y1, z1, lon1 = projected_meridian[i]
                x2, y2, z2, lon2 = projected_meridian[i + 1]
                front_color = 'red' if longitude == 0 else 'white'
                back_color = '#550000' if longitude == 0 else '#555555'
                if z1 >= 0 and z2 >= 0:
                    canvas.create_line(x1, y1, x2, y2, fill=front_color, width=1)
                elif z1 < 0 and z2 < 0:
                    canvas.create_line(x1, y1, x2, y2, fill=back_color, width=1)
                else:
                    t = abs(z1) / (abs(z1) + abs(z2))
                    ix = x1 + (x2 - x1) * t
                    iy = y1 + (y2 - y1) * t
                    if z1 >= 0:
                        canvas.create_line(x1, y1, ix, iy, fill=front_color, width=1)
                        canvas.create_line(ix, iy, x2, y2, fill=back_color, width=1)
                    else:
                        canvas.create_line(x1, y1, ix, iy, fill=back_color, width=1)
                        canvas.create_line(ix, iy, x2, y2, fill=front_color, width=1)

    # Always draw the prime meridian in red
    prime_meridian = sphere_meridian_points(0, 120)
    rotated_prime = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), x, y, z) for x, y, z in prime_meridian]
    projected_prime = [(*project(rx, ry, rz), rz) for rx, ry, rz, *_ in rotated_prime]
    for i in range(len(projected_prime) - 1):
        x1, y1, z1 = projected_prime[i]
        x2, y2, z2 = projected_prime[i + 1]
        if z1 >= 0 and z2 >= 0:
            canvas.create_line(x1, y1, x2, y2, fill='red', width=1)
        elif z1 < 0 and z2 < 0:
            canvas.create_line(x1, y1, x2, y2, fill='#550000', width=1)
        else:
            t = abs(z1) / (abs(z1) + abs(z2))
            ix = x1 + (x2 - x1) * t
            iy = y1 + (y2 - y1) * t
            if z1 >= 0:
                canvas.create_line(x1, y1, ix, iy, fill='red', width=1)
                canvas.create_line(ix, iy, x2, y2, fill='#550000', width=1)
            else:
                canvas.create_line(x1, y1, ix, iy, fill='#550000', width=1)
                canvas.create_line(ix, iy, x2, y2, fill='red', width=1)
    prime_label = next(((px, py, z) for px, py, z in projected_prime if z >= 0), projected_prime[len(projected_prime)//2])
    if prime_label:
        px, py, pz = prime_label
        canvas.create_text(
            px + 8,
            py + 8,
            anchor='w',
            text='prime meridian',
            fill=color_for_depth(pz, front='red', back='#550000'),
            font=('Arial', 10),
        )

    if position_a_var.get():
        lat_a, lon_a = position_a_latlon()
        green = '#4cff4c'
        green_back = '#006600'
        rest = '#555555'
        rest_back = '#111111'

        lat_rad = math.radians(lat_a)
        lat_z = RADIUS * math.sin(lat_rad)
        lat_radius = RADIUS * math.cos(lat_rad) * EQUATOR_SCALE
        parallel = []
        for i in range(120 + 1):
            theta = -math.pi + 2 * math.pi * i / 120
            x = lat_radius * math.cos(theta)
            y = lat_radius * math.sin(theta)
            parallel.append((x, y, lat_z, theta))
        rotated_parallel = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), theta) for x, y, z, theta in parallel]
        projected_parallel = [(*project(rx, ry, rz), rz, theta) for rx, ry, rz, theta in rotated_parallel]
        for i in range(len(projected_parallel) - 1):
            x1, y1, z1, theta1 = projected_parallel[i]
            x2, y2, z2, theta2 = projected_parallel[i + 1]
            if z1 >= 0 and z2 >= 0:
                canvas.create_line(x1, y1, x2, y2, fill=rest, width=2)
            elif z1 < 0 and z2 < 0:
                canvas.create_line(x1, y1, x2, y2, fill=rest_back, width=2)
            else:
                t = abs(z1) / (abs(z1) + abs(z2))
                ix = x1 + (x2 - x1) * t
                iy = y1 + (y2 - y1) * t
                if z1 >= 0:
                    canvas.create_line(x1, y1, ix, iy, fill=rest, width=2)
                    canvas.create_line(ix, iy, x2, y2, fill=rest_back, width=2)
                else:
                    canvas.create_line(x1, y1, ix, iy, fill=rest_back, width=2)
                    canvas.create_line(ix, iy, x2, y2, fill=rest, width=2)

        # Shorter equator arc from prime meridian to the meridian through A
        lon_a_rad = math.radians(lon_a)
        equator_arc = []
        for i in range(120 + 1):
            theta = -math.pi + 2 * math.pi * i / 120
            x = RADIUS * EQUATOR_SCALE * math.cos(theta)
            y = RADIUS * EQUATOR_SCALE * math.sin(theta)
            z = 0
            equator_arc.append((x, y, z, theta))
        rotated_equator = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), theta) for x, y, z, theta in equator_arc]
        projected_equator_a = [(*project(rx, ry, rz), rz, theta) for rx, ry, rz, theta in rotated_equator]
        for i in range(len(projected_equator_a) - 1):
            x1, y1, z1, theta1 = projected_equator_a[i]
            x2, y2, z2, theta2 = projected_equator_a[i + 1]
            active = is_between_longitude(theta1, lon_a_rad) or is_between_longitude(theta2, lon_a_rad)
            if active:
                line_color = green if z1 >= 0 or z2 >= 0 else green_back
            else:
                line_color = rest if z1 >= 0 or z2 >= 0 else rest_back
            canvas.create_line(x1, y1, x2, y2, fill=line_color, width=2)

        lon_rad = math.radians(lon_a)
        lat_a_rad = math.radians(lat_a)
        meridian_a = []
        for i in range(120 + 1):
            lat = -math.pi / 2 + math.pi * i / 120
            x = RADIUS * math.cos(lat) * math.cos(lon_rad) * EQUATOR_SCALE
            y = RADIUS * math.cos(lat) * math.sin(lon_rad) * EQUATOR_SCALE
            z = RADIUS * math.sin(lat)
            meridian_a.append((x, y, z, lat))
        rotated_meridian_a = [(*rotate_point(x, y, z, angle_x, angle_z, angle_y), lat) for x, y, z, lat in meridian_a]
        projected_meridian_a = [(*project(rx, ry, rz), rz, lat) for rx, ry, rz, lat in rotated_meridian_a]
        for i in range(len(projected_meridian_a) - 1):
            x1, y1, z1, lat1 = projected_meridian_a[i]
            x2, y2, z2, lat2 = projected_meridian_a[i + 1]
            active = is_between_latitude(lat1, lat_a_rad) or is_between_latitude(lat2, lat_a_rad)
            front_color = green if active else rest
            back_color = green_back if active else rest_back
            if z1 >= 0 and z2 >= 0:
                canvas.create_line(x1, y1, x2, y2, fill=front_color, width=2)
            elif z1 < 0 and z2 < 0:
                canvas.create_line(x1, y1, x2, y2, fill=back_color, width=2)
            else:
                t = abs(z1) / (abs(z1) + abs(z2))
                ix = x1 + (x2 - x1) * t
                iy = y1 + (y2 - y1) * t
                if z1 >= 0:
                    canvas.create_line(x1, y1, ix, iy, fill=front_color, width=2)
                    canvas.create_line(ix, iy, x2, y2, fill=back_color, width=2)
                else:
                    canvas.create_line(x1, y1, ix, iy, fill=back_color, width=2)
                    canvas.create_line(ix, iy, x2, y2, fill=front_color, width=2)

    # Label the equator close to a front-facing projected point if possible
    eq_front = next(((px, py, z) for px, py, z in projected_equator if z >= 0), None)
    if eq_front is None:
        eq_front = projected_equator[len(projected_equator) // 8]
    eq_label_x, eq_label_y, eq_label_z = eq_front
    canvas.create_text(
        eq_label_x + 10,
        eq_label_y - 10,
        anchor='w',
        text='equator',
        fill=color_for_depth(eq_label_z, front='red', back='#550000'),
        font=('Arial', 10),
    )

    if position_a_var.get():
        ax, ay, az = position_a_sphere_point()
        rx, ry, rz = rotate_point(ax, ay, az, angle_x, angle_z, angle_y)
        proj_x, proj_y = project(rx, ry, rz)
        marker_color = '#00ffff' if rz >= 0 else '#55ffff'
        canvas.create_oval(
            proj_x - 5,
            proj_y - 5,
            proj_x + 5,
            proj_y + 5,
            fill=marker_color,
            outline='',
        )
        label_text = f"A: {lat_deg_var.get()} {lat_min_var.get()} {lat_ns_var.get()}, {lon_deg_var.get()} {lon_min_var.get()} {lon_ew_var.get()}"
        text_color = '#ffffff'
        text_x = proj_x + 8 if proj_x < WIDTH - 120 else proj_x - 8
        anchor = 'w' if proj_x < WIDTH - 120 else 'e'
        canvas.create_text(
            text_x,
            proj_y + 8,
            anchor=anchor,
            text='Position A',
            fill=text_color,
            font=('Arial', 10, 'bold'),
        )

    # Draw north and south pole markers with labels
    poles = [
        (True, 'north pole', 4, -4),
        (False, 'south pole', 4, 4),
    ]
    for pole, label, offset_x, offset_y in poles:
        px, py, pz = sphere_pole_point(pole)
        rx, ry, rz = rotate_point(px, py, pz, angle_x, angle_z, angle_y)
        proj_x, proj_y = project(rx, ry, rz)
        marker_color = color_for_depth(rz, front='white', back='#bbbbbb')
        label_color = color_for_depth(rz, front='white', back='#bbbbbb')
        canvas.create_oval(
            proj_x - 3,
            proj_y - 3,
            proj_x + 3,
            proj_y + 3,
            fill=marker_color,
            outline='',
        )
        canvas.create_text(
            proj_x + offset_x,
            proj_y + offset_y,
            anchor='w',
            text=label,
            fill=label_color,
            font=('Arial', 10, 'bold'),
        )

    # Draw Earth center marker with label (always dull)
    canvas.create_oval(
        CENTER[0] - 5,
        CENTER[1] - 5,
        CENTER[0] + 5,
        CENTER[1] + 5,
        fill='#555555',
        outline='',
    )
    canvas.create_text(
        CENTER[0] + 10,
        CENTER[1] + 10,
        anchor='w',
        text='center',
        fill='#555555',
        font=('Arial', 10),
    )

    canvas.create_text(
        10,
        HEIGHT - 40,
        anchor='w',
        text='Drag to rotate the Earth',
        fill='white',
        font=('Arial', 14, 'bold'),
    )
    canvas.create_text(
        10,
        HEIGHT - 20,
        anchor='w',
        text=f'Mode: {navigation_mode.capitalize()} Navigation',
        fill='white',
        font=('Arial', 12, 'normal'),
    )


def on_press(event):
    global last_pos, drag_mode
    last_pos = (event.x, event.y)
    drag_mode = None


def on_drag(event):
    global angle_x, angle_y, angle_z, last_pos, drag_mode
    if last_pos is None:
        last_pos = (event.x, event.y)
        return

    dx = event.x - last_pos[0]
    dy = event.y - last_pos[1]
    last_pos = (event.x, event.y)

    if free_rotation:
        angle_y += dx * 0.01
        angle_x += dy * 0.01
        angle_z += dx * 0.003
    else:
        angle_y = 0.0
        if drag_mode is None:
            if abs(dx) >= abs(dy):
                drag_mode = 'horizontal'
            else:
                drag_mode = 'vertical'
        if drag_mode == 'horizontal':
            angle_z += dx * 0.01
        else:
            angle_x += dy * 0.01
    redraw()


def on_release(event):
    global last_pos
    last_pos = None


canvas.bind('<ButtonPress-1>', on_press)
canvas.bind('<B1-Motion>', on_drag)
canvas.bind('<ButtonRelease-1>', on_release)

redraw()
root.mainloop()
