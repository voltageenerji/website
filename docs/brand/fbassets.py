from PIL import Image, ImageDraw, ImageFont

INK=(10,14,26); GOLD=(201,169,97); PAPER=(245,243,236); MUTED=(138,148,168)
F='fonts/'

def mix(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))

# ---------- PROFİL: favicon geometrisi, 1080x1080 ----------
S=4; W=1080
im=Image.new('RGB',(W*S,W*S),INK); d=ImageDraw.Draw(im)
k=(W*S)/36.0                                   # viewBox 36 -> ölçek
cx=cy=18*k
d.ellipse([cx-15*k,cy-15*k,cx+15*k,cy+15*k], outline=mix(INK,GOLD,0.4), width=int(1*k))
pts=[(11*k,10*k),(18*k,26*k),(25*k,10*k)]
d.line(pts, fill=PAPER, width=int(2*k), joint='curve')
for p in (pts[0],pts[2]):                      # yuvarlak uçlar
    d.ellipse([p[0]-1*k,p[1]-1*k,p[0]+1*k,p[1]+1*k], fill=PAPER)
d.ellipse([cx-1.5*k,cy-1.5*k,cx+1.5*k,cy+1.5*k], fill=GOLD)
im.resize((W,W), Image.LANCZOS).save('fb-profile.png')

# ---------- KAPAK: 1640x624 ----------
CW,CH=1640,624
c=Image.new('RGB',(CW,CH),INK); dc=ImageDraw.Draw(c)
for y in range(CH):                            # ince dikey degrade
    dc.line([(0,y),(CW,y)], fill=mix((6,9,18),(14,19,34), y/CH))
m,L,t=54,150,3                                 # köşe ayraçları
for (x,y,sx,sy) in [(m,m,1,1),(CW-m,m,-1,1),(m,CH-m,1,-1),(CW-m,CH-m,-1,-1)]:
    dc.line([(x,y),(x+sx*L,y)], fill=GOLD, width=t)
    dc.line([(x,y),(x,y+sy*L)], fill=GOLD, width=t)

title=ImageFont.truetype(F+'News.ttf',104)
sub=ImageFont.truetype(F+'Arch.ttf',36)
mono=ImageFont.truetype(F+'Mono.ttf',23)
def ctr(txt,font,y,fill,track=0):
    if track:
        wid=sum(dc.textlength(ch,font=font)+track for ch in txt)-track
        x=(CW-wid)/2
        for ch in txt:
            dc.text((x,y),ch,font=font,fill=fill); x+=dc.textlength(ch,font=font)+track
    else:
        dc.text(((CW-dc.textlength(txt,font=font))/2,y),txt,font=font,fill=fill)

ctr('Voltage Enerji',title,214,PAPER)
ctr('Kurumsal ve Endüstriyel Elektrik Tedarikçisi',sub,344,MUTED)
dc.line([(CW/2-190,410),(CW/2+190,410)], fill=mix(INK,GOLD,0.45), width=2)
ctr('EPDK LİSANSLI TEDARİKÇİ  ·  VOLTAGE.COM.TR',mono,438,GOLD,track=3)
c.save('fb-cover.png')
print('üretildi: fb-profile.png (1080x1080), fb-cover.png (1640x624)')
