package com.doujin.shoppinglist;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeTrue;

@RunWith(AndroidJUnit4.class)
public class LauncherIconTest {
    private Bitmap render(Drawable drawable) {
        Bitmap bitmap = Bitmap.createBitmap(108, 108, Bitmap.Config.ARGB_8888);
        drawable.setBounds(0, 0, 108, 108);
        drawable.draw(new Canvas(bitmap));
        return bitmap;
    }

    @Test public void installedNameAndMonochromeMatchForeground() {
        assumeTrue(Build.VERSION.SDK_INT >= 33);
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("場購清單", context.getApplicationInfo().loadLabel(context.getPackageManager()).toString());
        for (int id : new int[] { R.mipmap.ic_launcher, R.mipmap.ic_launcher_round }) {
            Drawable icon = context.getDrawable(id);
            assertTrue(icon instanceof AdaptiveIconDrawable);
            AdaptiveIconDrawable adaptive = (AdaptiveIconDrawable) icon;
            assertNotNull(adaptive.getMonochrome());
            Bitmap foreground = render(adaptive.getForeground());
            Bitmap monochrome = render(adaptive.getMonochrome());
            assertTrue("Color and monochrome versions must use the same bag/check outline", foreground.sameAs(monochrome));
        }
    }

    @Test public void silhouetteIsInsideAdaptiveSafeArea() {
        assumeTrue(Build.VERSION.SDK_INT >= 33);
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        Bitmap mono = render(((AdaptiveIconDrawable) context.getDrawable(R.mipmap.ic_launcher)).getMonochrome());
        int visible = 0;
        for (int y = 0; y < 108; y++) for (int x = 0; x < 108; x++) {
            if (Color.alpha(mono.getPixel(x, y)) > 0) {
                visible++;
                assertTrue("Monochrome must fit safe region for circle/squircle masks", Math.hypot(x - 54, y - 54) <= 33);
            }
        }
        assertTrue(visible > 300);
    }
}
